from datetime import datetime, timezone

from fastapi import HTTPException, status
from pymongo.database import Database

from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password
from app.schemas.auth import LoginRequest, TokenResponse, UserOut


def authenticate(db: Database, data: LoginRequest) -> TokenResponse:
    user = db.users.find_one({"email": data.email.lower()})
    if user is None or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(str(user["_id"]), user["role"])
    return TokenResponse(access_token=token, user=UserOut.from_doc(user))


def create_user(db: Database, name: str, email: str, password: str, role: str) -> dict:
    doc = {
        "name": name,
        "email": email.lower(),
        "password_hash": hash_password(password),
        "role": role,
        "createdAt": datetime.now(timezone.utc),
    }
    result = db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc
