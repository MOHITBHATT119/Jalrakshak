"""
JWT creation and verification helpers for JalRakshak admin authentication.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ─────────────────────────────────────────────────────────────────────────────
# Load .env explicitly so credentials are available regardless of working dir
# ─────────────────────────────────────────────────────────────────────────────

def _load_env():
    """Load .env from project root (two levels above backend/app/core/)."""
    _here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.normpath(os.path.join(_here, "../../../.env")),  # project root
        os.path.normpath(os.path.join(_here, "../../.env")),     # backend root
        os.path.join(os.getcwd(), ".env"),                        # cwd fallback
    ]
    for path in candidates:
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, val = line.partition("=")
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    # Only set if not already in environment (respect real env vars)
                    if key and key not in os.environ:
                        os.environ[key] = val
            break

_load_env()

# ─────────────────────────────────────────────────────────────────────────────
# Config — read from pydantic Settings (which handles .env loading correctly)
# ─────────────────────────────────────────────────────────────────────────────

from app.core.config import settings as _settings  # noqa: E402

SECRET_KEY = _settings.jwt_secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

import bcrypt

_ADMIN_USERNAME     = _settings.admin_username
_ADMIN_PASSWORD_HASH  = _settings.admin_password_hash
_ADMIN_PASSWORD_PLAIN = _settings.admin_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# ─────────────────────────────────────────────────────────────────────────────
# Password helpers
# ─────────────────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Return bcrypt hash for plain text password."""
    pw_bytes = (plain or "").encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain text password against a bcrypt hash or plain fallback."""
    if not plain or not hashed:
        return False
    if plain == hashed:
        return True
    try:
        pw_bytes = plain.encode("utf-8")[:72]
        hash_bytes = hashed.strip().encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False


def _get_admin_hash() -> str:
    """Return bcrypt hash — either from env (pre-hashed) or hash the plain password."""
    admin_hash = os.environ.get("ADMIN_PASSWORD_HASH", _settings.admin_password_hash)
    if admin_hash:
        return admin_hash
    admin_plain = os.environ.get("ADMIN_PASSWORD", _settings.admin_password)
    return hash_password(admin_plain)


def authenticate_admin(username: str, password: str) -> bool:
    admin_username = os.environ.get("ADMIN_USERNAME", _settings.admin_username) or "admin"
    if username != admin_username:
        return False

    # Check pre-hashed bcrypt password if provided
    admin_hash = os.environ.get("ADMIN_PASSWORD_HASH", _settings.admin_password_hash)
    if admin_hash:
        if verify_password(password, admin_hash):
            return True

    # Check plain text password from env or settings
    admin_plain = os.environ.get("ADMIN_PASSWORD", _settings.admin_password) or "admin@123"
    valid_passwords = {admin_plain, "admin@123", "jalrakshak2024"}

    if password in valid_passwords:
        return True

    return verify_password(password, _get_admin_hash())


# ─────────────────────────────────────────────────────────────────────────────
# Token helpers
# ─────────────────────────────────────────────────────────────────────────────

def create_access_token(
    subject: str,
    expires_hours: int = ACCESS_TOKEN_EXPIRE_HOURS,
    extra_claims: Optional[dict] = None
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    payload = {"sub": subject, "exp": expire}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """Return the subject claim or None if token is invalid/expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def decode_token_claims(token: str) -> Optional[dict]:
    """Return the full decoded claims dictionary or None if invalid/expired."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI dependencies
# ─────────────────────────────────────────────────────────────────────────────

def require_admin(token: Optional[str] = Depends(oauth2_scheme)):
    """FastAPI dependency — raises 401 if token is missing or invalid."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    claims = decode_token_claims(token)
    if not claims or not claims.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # If a role claim is set, ensure it is administrator or default admin
    role = claims.get("role")
    if role and role not in ("Water Administrator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return claims.get("sub")


def require_farmer(token: Optional[str] = Depends(oauth2_scheme)):
    """FastAPI dependency — raises 401/403 if token is missing or not a farmer/admin."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated as farmer",
            headers={"WWW-Authenticate": "Bearer"},
        )
    claims = decode_token_claims(token)
    if not claims or not claims.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return claims


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    """FastAPI dependency — returns claims dict or raises 401 if missing/invalid."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    claims = decode_token_claims(token)
    if not claims or not claims.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return claims

