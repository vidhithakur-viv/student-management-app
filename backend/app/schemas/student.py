import re
from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, Field, field_validator



def as_utc(dt: datetime) -> datetime:
    """MongoDB returns naive UTC datetimes; make them timezone-aware so JSON ends in 'Z'/+00:00."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


_PHONE_RE = re.compile(r"^\+?[0-9][0-9\s\-]{6,18}[0-9]$")


class StudentBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str
    age: int = Field(ge=5, le=120)
    course: str = Field(min_length=1, max_length=100)
    year: int = Field(ge=1, le=10)

    @field_validator("name", "course")
    @classmethod
    def strip_required(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not _PHONE_RE.match(v):
            raise ValueError("must be a valid phone number (8-20 digits, optional leading +)")
        return v

    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        return v.lower()


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    """PUT replaces the full student record, so all fields are required."""


class StudentResponse(StudentBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    @classmethod
    def from_doc(cls, doc: dict) -> "StudentResponse":
        return cls(
            id=str(doc["_id"]),
            name=doc["name"],
            email=doc["email"],
            phone=doc["phone"],
            age=doc["age"],
            course=doc["course"],
            year=doc["year"],
            createdAt=as_utc(doc["createdAt"]),
            updatedAt=as_utc(doc["updatedAt"]),
        )
