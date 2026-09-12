"""
Admin User & Farmer Management router — /api/v1/admin/users
Allows administrators to view, approve, edit, suspend, and delete farmers and system users.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel
from app.core.security import require_admin, hash_password
from app.services.database import (
    db_get_users, db_get_user_by_id, db_create_user,
    db_update_user, db_update_user_status, db_delete_user,
    db_get_user_by_email_or_phone
)

user_router = APIRouter(prefix="/admin/users", tags=["admin-users"])


class CreateUserRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "Farmer"
    village: str
    district: str
    land_area_ha: Optional[float] = 0.0
    primary_crops: Optional[str] = ""
    status: str = "Active"
    password: Optional[str] = "farmer123"
    notes: Optional[str] = None


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    land_area_ha: Optional[float] = None
    primary_crops: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str  # 'Active' | 'Suspended' | 'Inactive'


@user_router.get("")
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role: Farmer, Community, Water Administrator, Evaluator"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: Active, Inactive, Suspended"),
    search: Optional[str] = Query(None, description="Search by name, email, village, or district"),
    _admin: str = Depends(require_admin),
):
    """
    List all registered platform users/farmers.
    Requires admin privileges.
    """
    users = db_get_users(role=role, status=status_filter)
    if search:
        q = search.lower().strip()
        users = [
            u for u in users
            if q in u.get("name", "").lower()
            or q in u.get("email", "").lower()
            or q in u.get("village", "").lower()
            or q in u.get("district", "").lower()
            or q in str(u.get("phone", "")).lower()
        ]
    return {
        "users": users,
        "count": len(users),
        "total_farmers": sum(1 for u in users if u.get("role") == "Farmer"),
        "active_farmers": sum(1 for u in users if u.get("role") == "Farmer" and u.get("status") == "Active"),
        "suspended_farmers": sum(1 for u in users if u.get("role") == "Farmer" and u.get("status") == "Suspended"),
    }


@user_router.get("/{user_id}")
async def get_user_detail(user_id: str, _admin: str = Depends(require_admin)):
    """Get single user profile by ID."""
    u = db_get_user_by_id(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@user_router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(req: CreateUserRequest, _admin: str = Depends(require_admin)):
    """Admin creates a new user or farmer."""
    if not req.name.strip():
        raise HTTPException(status_code=422, detail="Name is required")

    email = req.email.strip().lower() if req.email else None
    phone = req.phone.strip() if req.phone else None

    if email:
        if db_get_user_by_email_or_phone(email):
            raise HTTPException(status_code=400, detail=f"Email {email} already registered")
    if phone:
        if db_get_user_by_email_or_phone(phone):
            raise HTTPException(status_code=400, detail=f"Phone {phone} already registered")

    pwd = req.password or "farmer123"
    hashed = hash_password(pwd)

    new_u = db_create_user({
        "name": req.name.strip(),
        "email": email or "",
        "phone": phone or "",
        "password_hash": hashed,
        "role": req.role.strip(),
        "village": req.village.strip(),
        "district": req.district.strip(),
        "land_area_ha": req.land_area_ha or 0.0,
        "primary_crops": req.primary_crops or "",
        "status": req.status.strip(),
        "notes": req.notes or "Created by administrator",
        "is_demo": 0,
    })
    return {k: v for k, v in new_u.items() if k != "password_hash"}


@user_router.put("/{user_id}")
async def update_user(user_id: str, req: UpdateUserRequest, _admin: str = Depends(require_admin)):
    """Update user/farmer attributes."""
    existing = db_get_user_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    updates = (
        req.model_dump(exclude_unset=True)
        if hasattr(req, "model_dump")
        else {k: v for k, v in req.dict().items() if v is not None}
    )
    updates = {k: v for k, v in updates.items() if v is not None}
    updated = db_update_user(user_id, updates)
    return {k: v for k, v in updated.items() if k != "password_hash"}


@user_router.patch("/{user_id}/status")
async def update_user_status(user_id: str, req: UpdateStatusRequest, _admin: str = Depends(require_admin)):
    """Toggle or update status (Active, Suspended, Inactive)."""
    valid_statuses = {"Active", "Suspended", "Inactive"}
    if req.status not in valid_statuses:
        raise HTTPException(status_code=422, detail=f"Status must be one of {valid_statuses}")

    existing = db_get_user_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    db_update_user_status(user_id, req.status)
    return {"message": f"User status updated to {req.status}", "id": user_id, "status": req.status}


@user_router.delete("/{user_id}")
async def delete_user(user_id: str, _admin: str = Depends(require_admin)):
    """Remove a user or farmer record."""
    existing = db_get_user_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    db_delete_user(user_id)
    return {"message": "User deleted successfully", "id": user_id}
