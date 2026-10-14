import re
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo import ReturnDocument
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate


def _now() -> datetime:
    """Current UTC time truncated to milliseconds (MongoDB's datetime precision)."""
    n = datetime.now(timezone.utc)
    return n.replace(microsecond=n.microsecond // 1000 * 1000)


def _object_id(student_id: str) -> ObjectId:
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return ObjectId(student_id)


def _duplicate() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="A student with this email already exists",
    )


def list_students(db: Database) -> list[StudentResponse]:
    docs = db.students.find().sort("createdAt", -1)
    return [StudentResponse.from_doc(d) for d in docs]


def search_students(db: Database, query: str) -> list[StudentResponse]:
    query = query.strip()
    if not query:
        return list_students(db)
    pattern = {"$regex": re.escape(query), "$options": "i"}
    docs = db.students.find(
        {"$or": [{"name": pattern}, {"email": pattern}, {"course": pattern}]}
    ).sort("name", 1)
    return [StudentResponse.from_doc(d) for d in docs]


def get_student(db: Database, student_id: str) -> StudentResponse:
    doc = db.students.find_one({"_id": _object_id(student_id)})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return StudentResponse.from_doc(doc)


def create_student(db: Database, data: StudentCreate) -> StudentResponse:
    now = _now()
    doc = {**data.model_dump(), "createdAt": now, "updatedAt": now}
    try:
        result = db.students.insert_one(doc)
    except DuplicateKeyError:
        raise _duplicate()
    doc["_id"] = result.inserted_id
    return StudentResponse.from_doc(doc)


def update_student(db: Database, student_id: str, data: StudentUpdate) -> StudentResponse:
    oid = _object_id(student_id)
    update = {**data.model_dump(), "updatedAt": _now()}
    try:
        doc = db.students.find_one_and_update(
            {"_id": oid}, {"$set": update}, return_document=ReturnDocument.AFTER
        )
    except DuplicateKeyError:
        raise _duplicate()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return StudentResponse.from_doc(doc)


def delete_student(db: Database, student_id: str) -> None:
    result = db.students.delete_one({"_id": _object_id(student_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
