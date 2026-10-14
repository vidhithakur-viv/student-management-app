from fastapi import APIRouter, Depends, Query, Response, status
from pymongo.database import Database

from app.auth.jwt import require_roles
from app.database.mongodb import get_db
from app.schemas.auth import UserOut
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate
from app.services import student_service

router = APIRouter(prefix="/students", tags=["students"])

any_role = require_roles("admin", "faculty")
admin_only = require_roles("admin")


@router.get("", response_model=list[StudentResponse])
def list_students(db: Database = Depends(get_db), _: UserOut = Depends(any_role)):
    return student_service.list_students(db)


# NOTE: declared before "/{student_id}", otherwise "search" would be treated as an id.
@router.get("/search", response_model=list[StudentResponse])
def search_students(
    query: str = Query("", max_length=100),
    db: Database = Depends(get_db),
    _: UserOut = Depends(any_role),
):
    return student_service.search_students(db, query)


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Database = Depends(get_db), _: UserOut = Depends(any_role)):
    return student_service.get_student(db, student_id)


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    data: StudentCreate, db: Database = Depends(get_db), _: UserOut = Depends(any_role)
):
    return student_service.create_student(db, data)


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: str,
    data: StudentUpdate,
    db: Database = Depends(get_db),
    _: UserOut = Depends(any_role),
):
    return student_service.update_student(db, student_id, data)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: str, db: Database = Depends(get_db), _: UserOut = Depends(admin_only)
):
    student_service.delete_student(db, student_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
