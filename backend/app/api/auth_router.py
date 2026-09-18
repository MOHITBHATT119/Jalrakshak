"""
Auth router — hardened bearer-JWT authentication, refresh token rotation,
login rate limiting, audit trail logging, and password policy enforcement.
"""
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel

from app.api.routes import limiter
from app.core.security import (
    authenticate_admin,
    create_token_pair,
    create_access_token,
    verify_active_token,
    require_admin,
    require_farmer,
    validate_password_complexity,
    validate_email_format,
    validate_phone_format,
    hash_password,
    verify_password,
)
from app.services.database import (
    db_record_login_audit,
    db_revoke_token,
    db_get_user_by_email_or_phone,
    db_get_user_by_id,
    db_create_user,
    db_get_login_audit,
)

logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/auth", tags=["authentication"])


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 1800


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class FarmerSignupRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    village: str
    district: str
    land_area_ha: Optional[float] = 0.0
    primary_crops: Optional[str] = ""


class FarmerLoginRequest(BaseModel):
    identifier: str
    password: str


class FarmerAuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 1800
    user: Dict[str, Any]


# ─────────────────────────────────────────────────────────────────────────────
# Admin Authentication Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@auth_router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, req_body: Optional[LoginRequest] = None):
    """
    Exchange admin credentials for a signed JWT access & refresh token pair.
    Rate limited to 10 requests/minute per client IP.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    username = None
    password = None

    if req_body:
        username = req_body.username
        password = req_body.password
    else:
        # Support JSON or Form Data
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                data = await request.json()
                username = data.get("username")
                password = data.get("password")
            except Exception:
                pass
        elif "form" in content_type:
            try:
                form = await request.form()
                username = form.get("username")
                password = form.get("password")
            except Exception:
                pass

        if not username:
            try:
                data = await request.json()
                username = data.get("username")
                password = data.get("password")
            except Exception:
                pass

    if not username or not password:
        db_record_login_audit(
            identifier=username or "empty",
            ip_address=client_ip,
            user_agent=user_agent,
            success=False,
            failure_reason="Missing username or password",
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username and password are required",
        )

    if not authenticate_admin(username, password):
        db_record_login_audit(
            identifier=username,
            ip_address=client_ip,
            user_agent=user_agent,
            success=False,
            failure_reason="Invalid admin credentials",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = create_token_pair(
        subject=username,
        extra_claims={"role": "Water Administrator", "name": "System Administrator"},
    )

    db_record_login_audit(
        identifier=username,
        ip_address=client_ip,
        user_agent=user_agent,
        success=True,
    )

    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=tokens["expires_in"],
    )


@auth_router.get("/me")
async def get_current_admin(admin_sub: str = Depends(require_admin)):
    """
    Validate active admin token and return current admin identity and privileges.
    """
    return {
        "id": admin_sub,
        "username": admin_sub,
        "role": "Water Administrator",
        "status": "Active",
        "authenticated": True,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Token Refresh & Revocation Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(req: RefreshTokenRequest):
    """
    Rotate refresh token and issue a fresh access token pair.
    Revokes the old refresh token jti to prevent replay attacks.
    """
    claims = verify_active_token(req.refresh_token, expected_type="refresh")
    old_jti = claims.get("jti")
    sub = claims.get("sub")

    # Revoke old refresh token (rotation)
    if old_jti:
        db_revoke_token(old_jti)

    # Issue fresh token pair
    extra_claims = {k: v for k, v in claims.items() if k not in ("sub", "jti", "type", "exp", "iat")}
    tokens = create_token_pair(subject=str(sub), extra_claims=extra_claims)

    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=tokens["expires_in"],
    )


@auth_router.post("/logout")
async def logout_token(req: RefreshTokenRequest):
    """
    Revoke a token jti so it cannot be reused.
    """
    claims = verify_active_token(req.refresh_token, expected_type="refresh")
    jti = claims.get("jti")
    if jti:
        db_revoke_token(jti)
    return {"message": "Logged out successfully. Token revoked."}


@auth_router.get("/audit", dependencies=[Depends(require_admin)])
async def get_auth_audit_trail(limit: int = 50):
    """
    Return recent login audit logs (requires administrator privileges).
    """
    return {"audit_logs": db_get_login_audit(limit=limit)}


# ─────────────────────────────────────────────────────────────────────────────
# Farmer Authentication Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@auth_router.post("/farmer/signup", response_model=FarmerAuthResponse)
async def farmer_signup(req: FarmerSignupRequest):
    """
    Register a new farmer account with enforced password policy and valid contacts.
    """
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Farmer name is required")

    # Enforce password policy
    valid_pwd, reason = validate_password_complexity(req.password)
    if not valid_pwd:
        raise HTTPException(status_code=422, detail=reason)

    email = req.email.strip().lower() if req.email else None
    phone = req.phone.strip() if req.phone else None

    if not email and not phone:
        raise HTTPException(status_code=422, detail="Either email or mobile number is required")

    if email and not validate_email_format(email):
        raise HTTPException(status_code=422, detail="Invalid email address format")

    if phone and not validate_phone_format(phone):
        raise HTTPException(status_code=422, detail="Invalid mobile number format (must have >= 10 digits)")

    # Check for duplicate
    if email:
        existing = db_get_user_by_email_or_phone(email)
        if existing:
            raise HTTPException(status_code=400, detail=f"Account with email {email} already exists")
    if phone:
        existing = db_get_user_by_email_or_phone(phone)
        if existing:
            raise HTTPException(status_code=400, detail=f"Account with phone {phone} already exists")

    hashed = hash_password(req.password.strip())
    new_user = db_create_user({
        "name": name,
        "email": email or "",
        "phone": phone or "",
        "password_hash": hashed,
        "role": "Farmer",
        "village": req.village.strip(),
        "district": req.district.strip(),
        "land_area_ha": req.land_area_ha or 0.0,
        "primary_crops": req.primary_crops or "",
        "status": "Active",
        "is_demo": 0,
        "notes": "Registered via Farmer Portal",
    })

    user_clean = {k: v for k, v in new_user.items() if k != "password_hash"}
    tokens = create_token_pair(
        subject=new_user["id"],
        extra_claims={
            "role": "Farmer",
            "name": new_user["name"],
            "village": new_user.get("village", ""),
            "district": new_user.get("district", ""),
        },
    )

    return FarmerAuthResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=tokens["expires_in"],
        user=user_clean,
    )


@auth_router.post("/farmer/login", response_model=FarmerAuthResponse)
@limiter.limit("10/minute")
async def farmer_login(request: Request, req: FarmerLoginRequest):
    """
    Authenticate a farmer via mobile or email + password.
    Rate limited to 10 requests/minute per client IP.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    ident = req.identifier.strip()
    pwd = req.password.strip()
    if not ident or not pwd:
        db_record_login_audit(
            identifier=ident or "empty",
            ip_address=client_ip,
            user_agent=user_agent,
            success=False,
            failure_reason="Missing identifier or password",
        )
        raise HTTPException(status_code=422, detail="Mobile/email and password are required")

    user = db_get_user_by_email_or_phone(ident)
    if not user:
        db_record_login_audit(
            identifier=ident,
            ip_address=client_ip,
            user_agent=user_agent,
            success=False,
            failure_reason="User not found",
        )
        raise HTTPException(status_code=401, detail="Invalid mobile number/email or password")

    if not verify_password(pwd, user.get("password_hash", "")):
        db_record_login_audit(
            identifier=ident,
            ip_address=client_ip,
            user_agent=user_agent,
            success=False,
            failure_reason="Incorrect password",
        )
        raise HTTPException(status_code=401, detail="Invalid mobile number/email or password")

    if user.get("status") == "Suspended":
        db_record_login_audit(
            identifier=ident,
            ip_address=client_ip,
            user_agent=user_agent,
            success=False,
            failure_reason="Account suspended",
        )
        raise HTTPException(
            status_code=403,
            detail="Your account is currently suspended. Please contact the water administrator.",
        )

    user_clean = {k: v for k, v in user.items() if k != "password_hash"}
    tokens = create_token_pair(
        subject=user["id"],
        extra_claims={
            "role": user.get("role", "Farmer"),
            "name": user["name"],
            "village": user.get("village", ""),
            "district": user.get("district", ""),
        },
    )

    db_record_login_audit(
        identifier=ident,
        ip_address=client_ip,
        user_agent=user_agent,
        success=True,
    )

    return FarmerAuthResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=tokens["expires_in"],
        user=user_clean,
    )


@auth_router.get("/farmer/me")
async def farmer_me(claims: Dict[str, Any] = Depends(require_farmer)):
    """
    Return currently logged in farmer's profile.
    Uses require_farmer security dependency.
    """
    sub = claims.get("sub")
    user = db_get_user_by_id(str(sub))
    if not user:
        raise HTTPException(status_code=404, detail="Farmer account not found")

    return {k: v for k, v in user.items() if k != "password_hash"}
