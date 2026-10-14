import os

os.environ.setdefault("JWT_SECRET", "test-secret-test-secret-test-secret-123")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")

import mongomock
import pytest
from fastapi.testclient import TestClient

from app.database import mongodb
from app.database.mongodb import create_indexes
from app.main import app
from app.services.auth_service import create_user


@pytest.fixture()
def db():
    database = mongomock.MongoClient().student_management_test
    mongodb.set_db(database)
    create_indexes(database)
    create_user(database, "Admin", "admin@example.com", "Admin@123", "admin")
    create_user(database, "Faculty", "faculty@example.com", "Faculty@123", "faculty")
    yield database
    mongodb.set_db(None)


@pytest.fixture()
def client(db):
    # no `with` block: skip lifespan so nothing touches a real MongoDB
    return TestClient(app)


def _login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def admin_headers(client):
    return _login(client, "admin@example.com", "Admin@123")


@pytest.fixture()
def faculty_headers(client):
    return _login(client, "faculty@example.com", "Faculty@123")


@pytest.fixture()
def student_payload():
    return {
        "name": "Asha Verma",
        "email": "asha@example.com",
        "phone": "+91 98765 43210",
        "age": 20,
        "course": "Computer Science",
        "year": 2,
    }
