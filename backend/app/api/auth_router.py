"""
Auth router — POST /api/v1/auth/login  →  returns a JWT for admin access.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from app.core.security import authenticate_admin, create_access_token

auth_router = APIRouter(prefix="/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@auth_router.post("/login", response_model=TokenResponse)
async def login(request: Request, req_body: Optional[LoginRequest] = None):
    """
    Exchange admin credentials for a signed JWT.
    Accepts JSON body ({"username": "...", "password": "..."}) or Form Data.
    The JWT is valid for 8 hours and must be sent as
    `Authorization: Bearer <token>` on all protected /data/* routes.
    """
    username = None
    password = None

    if req_body:
        username = req_body.username
        password = req_body.password
    else:
        # Try parsing JSON or Form Data dynamically
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
        
        # Fallback if content-type header was missing or ambiguous
        if not username:
            try:
                data = await request.json()
                username = data.get("username")
                password = data.get("password")
            except Exception:
                try:
                    form = await request.form()
                    username = form.get("username")
                    password = form.get("password")
                except Exception:
                    pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username and password are required",
        )

    if not authenticate_admin(username, password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(username, extra_claims={"role": "Water Administrator"})
    return TokenResponse(access_token=token)


# ─────────────────────────────────────────────────────────────────────────────
# Farmer Authentication Schemas & Endpoints
# ─────────────────────────────────────────────────────────────────────────────

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
    identifier: str  # email or mobile number
    password: str


class FarmerAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@auth_router.post("/farmer/signup", response_model=FarmerAuthResponse)
async def farmer_signup(req: FarmerSignupRequest):
    """
    Register a new farmer account.
    Stores the farmer profile and returns a valid JWT.
    """
    from app.services.database import db_get_user_by_email_or_phone, db_create_user
    from app.core.security import hash_password

    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Farmer name is required")
    
    if len(req.password.strip()) < 4:
        raise HTTPException(status_code=422, detail="Password must be at least 4 characters long")

    email = req.email.strip().lower() if req.email else None
    phone = req.phone.strip() if req.phone else None

    if not email and not phone:
        raise HTTPException(status_code=422, detail="Either email or mobile number is required")

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
    token = create_access_token(
        subject=new_user["id"],
        extra_claims={
            "role": "Farmer",
            "name": new_user["name"],
            "village": new_user.get("village", ""),
            "district": new_user.get("district", ""),
        }
    )
    return FarmerAuthResponse(access_token=token, user=user_clean)


@auth_router.post("/farmer/login", response_model=FarmerAuthResponse)
async def farmer_login(req: FarmerLoginRequest):
    """
    Authenticate a farmer via mobile or email + password.
    Returns access token and profile info.
    """
    from app.services.database import db_get_user_by_email_or_phone
    from app.core.security import verify_password

    ident = req.identifier.strip()
    pwd = req.password.strip()
    if not ident or not pwd:
        raise HTTPException(status_code=422, detail="Mobile/email and password are required")

    user = db_get_user_by_email_or_phone(ident)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid mobile number/email or password")

    if not verify_password(pwd, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid mobile number/email or password")

    if user.get("status") == "Suspended":
        raise HTTPException(
            status_code=403,
            detail="Your account is currently suspended. Please contact the water administrator."
        )

    user_clean = {k: v for k, v in user.items() if k != "password_hash"}
    token = create_access_token(
        subject=user["id"],
        extra_claims={
            "role": user.get("role", "Farmer"),
            "name": user["name"],
            "village": user.get("village", ""),
            "district": user.get("district", ""),
        }
    )
    return FarmerAuthResponse(access_token=token, user=user_clean)


@auth_router.get("/farmer/me")
async def farmer_me(request: Request):
    """
    Return currently logged in farmer's profile.
    Requires Bearer token in Authorization header.
    """
    from app.core.security import decode_token_claims
    from app.services.database import db_get_user_by_id

    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    raw_token = auth.split(" ", 1)[1]
    claims = decode_token_claims(raw_token)
    if not claims or not claims.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db_get_user_by_id(claims["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="Farmer account not found")

    return {k: v for k, v in user.items() if k != "password_hash"}

