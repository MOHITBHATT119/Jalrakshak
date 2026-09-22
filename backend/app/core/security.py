"""
JWT creation, token rotation, and security verification helpers for JalRakshak AI.
Enforces bcrypt hashing, rotating refresh tokens with jti revocation,
fail-fast production secrets, and strict role permissions.
"""
import os
import re
import uuid
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

logger = logging.getLogger(__name__)

# ── Load environment configuration ──────────────────────────────────────────
from app.core.config import settings as _settings

# Determine environment mode
IS_PRODUCTION = os.environ.get("ENV", "").lower() in ("prod", "production") or bool(
    os.environ.get("RENDER") or os.environ.get("VERCEL") or os.environ.get("FLY_APP_NAME")
)

# Secret key validation & ephemeral fallback
_raw_secret = os.environ.get("JWT_SECRET_KEY", _settings.jwt_secret_key or "").strip()
_WEAK_SECRETS = {
    "", "CHANGE_ME_IN_PROD_jalrakshak_2024_secret", "jalrakshak_2024_secret",
    "secret", "change_me", "admin123", "jalrakshak2024"
}

if IS_PRODUCTION:
    if not _raw_secret or _raw_secret in _WEAK_SECRETS or len(_raw_secret) < 32:
        raise RuntimeError(
            "FATAL: Insecure JWT_SECRET_KEY detected in production environment! "
            "Please set a cryptographically strong random secret (>= 32 chars) in environment."
        )
    SECRET_KEY = _raw_secret
else:
    if not _raw_secret or _raw_secret in _WEAK_SECRETS:
        SECRET_KEY = secrets.token_hex(32)
        logger.warning(
            "JWT_SECRET_KEY was not configured or used a default value. "
            "Generated an ephemeral 256-bit dev secret for this process."
        )
    else:
        SECRET_KEY = _raw_secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

_ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", _settings.admin_username) or "admin"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# ─────────────────────────────────────────────────────────────────────────────
# Password policy and hashing helpers
# ─────────────────────────────────────────────────────────────────────────────

def validate_password_complexity(password: str) -> Tuple[bool, str]:
    """
    Enforce password policy:
    - Minimum 8 characters
    - Contains at least one letter and at least one digit or special symbol
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one alphabetic character."
    if not re.search(r"[\d\W_]", password):
        return False, "Password must contain at least one number or special character."
    return True, ""


def validate_email_format(email: str) -> bool:
    """Validate standard RFC email format."""
    if not email:
        return False
    return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email.strip()))


def validate_phone_format(phone: str) -> bool:
    """Validate Indian / standard 10-digit mobile phone format."""
    if not phone:
        return False
    digits = re.sub(r"[^\d]", "", phone)
    return len(digits) >= 10


def hash_password(plain: str) -> str:
    """Return bcrypt hash for plain text password."""
    pw_bytes = (plain or "").encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """
    Strictly verify plain text against bcrypt hash.
    Plaintext-equality bypasses are strictly prohibited.
    """
    if not plain or not hashed or not hashed.startswith("$2"):
        return False
    try:
        pw_bytes = plain.encode("utf-8")[:72]
        hash_bytes = hashed.strip().encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False


def _get_admin_hash() -> str:
    """Retrieve pre-configured admin password hash."""
    admin_hash = os.environ.get("ADMIN_PASSWORD_HASH", _settings.admin_password_hash)
    if admin_hash and admin_hash.startswith("$2"):
        return admin_hash
    admin_plain = os.environ.get("ADMIN_PASSWORD", _settings.admin_password) or "admin@123"
    return hash_password(admin_plain)


def authenticate_admin(username: str, password: str) -> bool:
    """Authenticate administrator strictly via bcrypt verification."""
    if username != _ADMIN_USERNAME:
        return False
    return verify_password(password, _get_admin_hash())


# ─────────────────────────────────────────────────────────────────────────────
# Token creation & rotation helpers
# ─────────────────────────────────────────────────────────────────────────────

def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Generate a signed, short-lived bearer access token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    jti = str(uuid.uuid4())
    payload: Dict[str, Any] = {
        "sub": subject,
        "jti": jti,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(subject: str, extra_claims: Optional[Dict[str, Any]] = None) -> str:
    """Generate a signed refresh token with rotation jti."""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    jti = str(uuid.uuid4())
    payload: Dict[str, Any] = {
        "sub": subject,
        "jti": jti,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_token_pair(
    subject: str,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Issue a fresh access and refresh token pair."""
    return {
        "access_token": create_access_token(subject, extra_claims=extra_claims),
        "refresh_token": create_refresh_token(subject, extra_claims=extra_claims),
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def decode_token_claims(token: str) -> Optional[Dict[str, Any]]:
    """Decode token claims and verify signature and expiration."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_active_token(token: str, expected_type: str = "access") -> Dict[str, Any]:
    """
    Validate token signature, expiration, type claim, and database revocation status.
    Raises HTTPException(401) on failure.
    """
    claims = decode_token_claims(token)
    if not claims or not claims.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if claims.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token type: expected '{expected_type}'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jti = claims.get("jti")
    if jti:
        from app.services.database import db_is_token_revoked
        if db_is_token_revoked(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return claims


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI dependencies
# ─────────────────────────────────────────────────────────────────────────────

def require_admin(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    """FastAPI dependency — requires valid admin bearer access token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = verify_active_token(token, expected_type="access")
    role = claims.get("role")
    sub = claims.get("sub")

    if role not in ("Water Administrator", "admin") and sub != _ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required",
        )

    return str(sub)


def require_farmer(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """FastAPI dependency — requires valid farmer or admin bearer access token and active status."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = verify_active_token(token, expected_type="access")
    sub = claims.get("sub")

    # If sub maps to a user ID in DB, verify status is Active
    if sub and sub != _ADMIN_USERNAME:
        from app.services.database import db_get_user_by_id
        user = db_get_user_by_id(sub)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found",
            )
        if user.get("status") == "Suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is suspended. Please contact the administrator.",
            )

    return claims


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """FastAPI dependency — returns claims for any authenticated user."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_active_token(token, expected_type="access")
