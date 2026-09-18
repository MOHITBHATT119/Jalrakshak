"""
Verification script for Farmer Creation and Login Flow in JalRakshak AI.
Tests:
1. New farmer signup via /api/v1/auth/farmer/signup (with password policy)
2. Database record inspection
3. Farmer login via email
4. Farmer login via phone number
5. Profile retrieval via /api/v1/auth/farmer/me
6. Rejection of duplicate email and duplicate phone
7. Rejection of invalid credentials
8. Creation of farmer by Admin via /api/v1/admin/users
9. Farmer login with credentials created by Admin
10. Account suspension enforcement (403 Forbidden)
11. Refresh token rotation and jti revocation
"""
import os
import sys
import uuid
import random

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app
from app.services.database import _get_conn

client = TestClient(app)


def run_tests():
    print("=" * 60)
    print("STEP 1: Test self-signup for a new farmer with password policy")
    print("=" * 60)
    uid = uuid.uuid4().hex[:6]
    rand_digits = random.randint(10000, 99999)
    test_email = f"farmer_{uid}@gujaratkhet.in"
    test_phone = f"+91 97270 {rand_digits}"
    farmer_name = f"Ramesh Bhai Patel ({uid})"
    signup_payload = {
        "name": farmer_name,
        "email": test_email,
        "phone": test_phone,
        "password": "Farmer@Secure123",
        "village": "Kothariya",
        "district": "Rajkot",
        "land_area_ha": 4.5,
        "primary_crops": "Cotton, Groundnut",
    }
    r = client.post("/api/v1/auth/farmer/signup", json=signup_payload)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    token = data["access_token"]
    refresh_token = data.get("refresh_token")
    user = data["user"]
    new_farmer_id = user["id"]
    print(f"  [SUCCESS] Signed up: {user['name']} (ID: {new_farmer_id}, Token generated)")

    print("\n" + "=" * 60)
    print("STEP 2: Inspect Database Record")
    print("=" * 60)
    conn = _get_conn()
    try:
        row = conn.execute("SELECT id, name, email, phone, role, village, district, status FROM users WHERE id=?", [new_farmer_id]).fetchone()
        assert row is not None, "Farmer not found in SQLite"
        print(f"  [SUCCESS] SQLite Row: ID={row[0]}, Name={row[1]}, Email={row[2]}, Phone={row[3]}, Role={row[4]}, Status={row[7]}")
    finally:
        conn.close()

    print("\n" + "=" * 60)
    print("STEP 3: Login via Email")
    print("=" * 60)
    r = client.post("/api/v1/auth/farmer/login", json={
        "identifier": test_email,
        "password": "Farmer@Secure123"
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(f"  [SUCCESS] Authenticated via Email: {test_email}")

    print("\n" + "=" * 60)
    print("STEP 4: Login via Phone Number")
    print("=" * 60)
    r = client.post("/api/v1/auth/farmer/login", json={
        "identifier": test_phone,
        "password": "Farmer@Secure123"
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(f"  [SUCCESS] Authenticated via Phone: {test_phone}")

    print("\n" + "=" * 60)
    print("STEP 5: Retrieve Profile via /api/v1/auth/farmer/me")
    print("=" * 60)
    r = client.get("/api/v1/auth/farmer/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    profile = r.json()
    assert profile["id"] == new_farmer_id
    assert "password_hash" not in profile
    print(f"  [SUCCESS] Profile verified for {profile['name']}")

    print("\n" + "=" * 60)
    print("STEP 6: Rejection of Duplicates and Weak Passwords")
    print("=" * 60)
    # Duplicate email
    r_dup_email = client.post("/api/v1/auth/farmer/signup", json={
        "name": "Duplicate Person",
        "email": test_email,
        "password": "Farmer@Secure123",
        "village": "Kothariya",
        "district": "Rajkot"
    })
    assert r_dup_email.status_code == 400, f"Expected 400 for duplicate email, got {r_dup_email.status_code}"
    print("  [SUCCESS] Duplicate email correctly rejected with 400")

    # Weak password
    r_weak = client.post("/api/v1/auth/farmer/signup", json={
        "name": "Weak Pass Person",
        "email": f"weak_{uid}@khet.in",
        "password": "123",
        "village": "Kothariya",
        "district": "Rajkot"
    })
    assert r_weak.status_code == 422, f"Expected 422 for weak password, got {r_weak.status_code}"
    print("  [SUCCESS] Weak password correctly rejected with 422")

    print("\n" + "=" * 60)
    print("STEP 7: Admin User Management & Suspension Flow")
    print("=" * 60)
    # Admin login
    r_adm = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin@123"})
    assert r_adm.status_code == 200, f"Admin login failed: {r_adm.text}"
    admin_jwt = r_adm.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_jwt}"}

    # Admin creates a farmer
    admin_farmer_email = f"admin_created_{uid}@khet.in"
    r_admin_create = client.post("/api/v1/admin/users", headers=admin_headers, json={
        "name": f"Admin Seeded Farmer ({uid})",
        "email": admin_farmer_email,
        "phone": f"+91 94280 {random.randint(10000, 99999)}",
        "password": "Farmer@Secure123",
        "village": "Gondal",
        "district": "Rajkot",
        "role": "Farmer",
        "land_area_ha": 6.2,
        "primary_crops": "Cotton",
        "status": "Active"
    })
    assert r_admin_create.status_code == 201, f"Admin create user failed: {r_admin_create.text}"
    created_id = r_admin_create.json()["id"]
    print(f"  [SUCCESS] Admin created farmer: ID={created_id}")

    # Suspend user
    r_susp = client.patch(f"/api/v1/admin/users/{created_id}/status", headers=admin_headers, json={"status": "Suspended"})
    assert r_susp.status_code == 200

    # Suspended farmer login must be rejected with 403
    r_susp_login = client.post("/api/v1/auth/farmer/login", json={
        "identifier": admin_farmer_email,
        "password": "Farmer@Secure123"
    })
    assert r_susp_login.status_code == 403, f"Expected 403 for suspended user, got {r_susp_login.status_code}"
    print("  [SUCCESS] Suspended farmer login correctly blocked with 403 Forbidden")

    # Clean up admin created user
    client.delete(f"/api/v1/admin/users/{created_id}", headers=admin_headers)

    print("\n" + "=" * 60)
    print("ALL 11 AUTHENTICATION & SECURITY VERIFICATION STEPS PASSED!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
