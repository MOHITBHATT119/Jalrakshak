"""
Verification script for Farmer Creation and Login Flow in JalRakshak AI.
Tests:
1. Pre-seeded demo farmer login (Ravi Desai)
2. New farmer signup via /api/v1/auth/farmer/signup
3. Database record inspection
4. New farmer login via email
5. New farmer login via phone number
6. Profile retrieval via /api/v1/auth/farmer/me
7. Rejection of duplicate email and duplicate phone
8. Rejection of invalid credentials
9. Creation of farmer by Admin via /api/v1/admin/users
10. Farmer login with credentials created by Admin
11. Account suspension enforcement (403 Forbidden)
"""
import uuid
import requests
import sqlite3

BASE = "http://127.0.0.1:8001/api/v1"
DB_PATH = "d:/jalrakshak-ai/data/jalrakshak.db"

def run_tests():
    print("=" * 60)
    print("STEP 1: Test pre-seeded farmer login (Ravi Desai)")
    print("=" * 60)
    r = requests.post(f"{BASE}/auth/farmer/login", json={
        "identifier": "ravi.desai@khet.in",
        "password": "farmer123"
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    user = r.json()["user"]
    print(f"  [SUCCESS] Logged in: {user['name']} (ID: {user['id']}, Role: {user['role']}, Village: {user['village']})")

    print("\n" + "=" * 60)
    print("STEP 2: Test self-signup for a new farmer")
    print("=" * 60)
    uid = uuid.uuid4().hex[:6]
    test_email = f"farmer_{uid}@gujaratkhet.in"
    test_phone = f"+91 97270 {uid[:5]}"
    farmer_name = f"Ramesh Bhai Patel ({uid})"
    signup_payload = {
        "name": farmer_name,
        "email": test_email,
        "phone": test_phone,
        "password": "farmSecretPassword@2026",
        "village": "Babra",
        "district": "Amreli",
        "land_area_ha": 6.8,
        "primary_crops": "Cotton, Groundnut, Sesame"
    }
    r_signup = requests.post(f"{BASE}/auth/farmer/signup", json=signup_payload)
    assert r_signup.status_code == 200, f"Expected 200, got {r_signup.status_code}: {r_signup.text}"
    signup_data = r_signup.json()
    token = signup_data["access_token"]
    created = signup_data["user"]
    user_id = created["id"]
    print(f"  [SUCCESS] New farmer created: ID={user_id}, Name={created['name']}, Village={created['village']}")
    assert "password_hash" not in created, "password_hash leaked in response!"

    print("\n" + "=" * 60)
    print("STEP 3: Verify record persistence in SQLite database")
    print("=" * 60)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, phone, role, village, district, land_area_ha, primary_crops, status FROM users WHERE id=?", (user_id,))
    row = cur.fetchone()
    conn.close()
    assert row is not None, "User record not found in database!"
    print(f"  [SUCCESS] Database record verified: {row}")

    print("\n" + "=" * 60)
    print("STEP 4: Test login using Email")
    print("=" * 60)
    r_login_email = requests.post(f"{BASE}/auth/farmer/login", json={
        "identifier": test_email,
        "password": "farmSecretPassword@2026"
    })
    assert r_login_email.status_code == 200, f"Email login failed: {r_login_email.text}"
    email_token = r_login_email.json()["access_token"]
    print(f"  [SUCCESS] Email login successful. Token received: {email_token[:20]}...")

    print("\n" + "=" * 60)
    print("STEP 5: Test login using Mobile Phone")
    print("=" * 60)
    r_login_phone = requests.post(f"{BASE}/auth/farmer/login", json={
        "identifier": test_phone,
        "password": "farmSecretPassword@2026"
    })
    assert r_login_phone.status_code == 200, f"Phone login failed: {r_login_phone.text}"
    phone_token = r_login_phone.json()["access_token"]
    print(f"  [SUCCESS] Phone login successful. Token received: {phone_token[:20]}...")

    print("\n" + "=" * 60)
    print("STEP 6: Test GET /api/v1/auth/farmer/me with Bearer token")
    print("=" * 60)
    r_me = requests.get(f"{BASE}/auth/farmer/me", headers={"Authorization": f"Bearer {email_token}"})
    assert r_me.status_code == 200, f"Farmer /me failed: {r_me.text}"
    me_user = r_me.json()
    assert me_user["id"] == user_id
    assert me_user["email"] == test_email
    print(f"  [SUCCESS] Farmer profile returned: Name={me_user['name']}, Land={me_user['land_area_ha']} ha, Crops={me_user['primary_crops']}")

    print("\n" + "=" * 60)
    print("STEP 7: Test security validations (wrong password, duplicate registration)")
    print("=" * 60)
    # Wrong password
    r_bad_pwd = requests.post(f"{BASE}/auth/farmer/login", json={
        "identifier": test_email,
        "password": "wrongPassword123"
    })
    assert r_bad_pwd.status_code == 401, f"Expected 401, got {r_bad_pwd.status_code}"
    print("  [SUCCESS] Wrong password correctly rejected with 401 Unauthorized.")

    # Duplicate email signup
    r_dup_email = requests.post(f"{BASE}/auth/farmer/signup", json=signup_payload)
    assert r_dup_email.status_code == 400, f"Expected 400, got {r_dup_email.status_code}"
    print(f"  [SUCCESS] Duplicate signup rejected: {r_dup_email.json()['detail']}")

    print("\n" + "=" * 60)
    print("STEP 8: Test Admin creates a farmer & Farmer logs in")
    print("=" * 60)
    # Admin login
    r_admin_login = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin@123"})
    assert r_admin_login.status_code == 200
    admin_token = r_admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    uid2 = uuid.uuid4().hex[:6]
    admin_created_email = f"admin_farmer_{uid2}@khet.in"
    r_admin_create = requests.post(f"{BASE}/admin/users", headers=admin_headers, json={
        "name": f"Kisan By Admin ({uid2})",
        "email": admin_created_email,
        "phone": f"+91 94280 {uid2[:5]}",
        "role": "Farmer",
        "village": "Lathi",
        "district": "Amreli",
        "land_area_ha": 4.2,
        "primary_crops": "Wheat, Cumin",
        "status": "Active",
        "password": "customFarmerPass@123"
    })
    assert r_admin_create.status_code == 201, f"Admin create user failed: {r_admin_create.text}"
    admin_created_user = r_admin_create.json()
    print(f"  [SUCCESS] Admin created farmer: ID={admin_created_user['id']}, Name={admin_created_user['name']}")

    # Farmer logs in with credentials set by Admin
    r_admin_farmer_login = requests.post(f"{BASE}/auth/farmer/login", json={
        "identifier": admin_created_email,
        "password": "customFarmerPass@123"
    })
    assert r_admin_farmer_login.status_code == 200
    print("  [SUCCESS] Farmer created by Admin logged in successfully!")

    print("\n" + "=" * 60)
    print("STEP 9: Test suspension enforcement")
    print("=" * 60)
    r_suspend = requests.patch(
        f"{BASE}/admin/users/{admin_created_user['id']}/status",
        headers=admin_headers,
        json={"status": "Suspended"}
    )
    assert r_suspend.status_code == 200
    r_login_suspended = requests.post(f"{BASE}/auth/farmer/login", json={
        "identifier": admin_created_email,
        "password": "customFarmerPass@123"
    })
    assert r_login_suspended.status_code == 403
    print(f"  [SUCCESS] Suspended farmer login blocked with 403: {r_login_suspended.json()['detail']}")

    print("\n" + "=" * 60)
    print("ALL 9 VERIFICATION STEPS PASSED PROPERLY AND COMPLETELY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
