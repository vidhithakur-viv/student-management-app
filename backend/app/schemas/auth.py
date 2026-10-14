from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["admin", "faculty"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    createdAt: datetime | None = None

    @classmethod
    def from_doc(cls, doc: dict) -> "UserOut":
        return cls(
            id=str(doc["_id"]),
            name=doc["name"],
            email=doc["email"],
            role=doc["role"],
            createdAt=doc.get("createdAt") and (
                doc["createdAt"].replace(tzinfo=timezone.utc)
                if doc["createdAt"].tzinfo is None
                else doc["createdAt"]
            ),
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
