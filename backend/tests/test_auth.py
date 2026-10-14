import time

import jwt

from app.auth.jwt import create_access_token
from app.config.settings import get_settings


def test_login_success(client):
    r = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "Admin@123"})
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["role"] == "admin"
    assert "password_hash" not in body["user"]


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "nope"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


def test_login_unknown_user(client):
    r = client.post("/api/auth/login", json={"email": "x@example.com", "password": "nope"})
    assert r.status_code == 401


def test_login_validation_error(client):
    r = client.post("/api/auth/login", json={"email": "not-an-email", "password": "x"})
    assert r.status_code == 422


def test_password_is_hashed(db):
    user = db.users.find_one({"email": "admin@example.com"})
    assert user["password_hash"] != "Admin@123"
    assert user["password_hash"].startswith("$2")


def test_me_requires_token(client, admin_headers):
    assert client.get("/api/auth/me").status_code == 401
    r = client.get("/api/auth/me", headers=admin_headers)
    assert r.status_code == 200 and r.json()["email"] == "admin@example.com"


def test_invalid_token_rejected(client):
    r = client.get("/api/students", headers={"Authorization": "Bearer garbage"})
    assert r.status_code == 401


def test_expired_token_rejected(client, db):
    user = db.users.find_one({"email": "admin@example.com"})
    s = get_settings()
    expired = jwt.encode(
        {"sub": str(user["_id"]), "role": "admin", "exp": int(time.time()) - 10},
        s.jwt_secret,
        algorithm=s.jwt_algorithm,
    )
    r = client.get("/api/students", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Token has expired"


def test_token_for_deleted_user_rejected(client, db):
    user = db.users.find_one({"email": "admin@example.com"})
    token = create_access_token(str(user["_id"]), "admin")
    db.users.delete_one({"_id": user["_id"]})
    r = client.get("/api/students", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
