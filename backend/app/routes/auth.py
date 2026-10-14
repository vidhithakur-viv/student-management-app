from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.auth.jwt import get_current_user
from app.database.mongodb import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Database = Depends(get_db)):
    return auth_service.authenticate(db, data)


@router.get("/me", response_model=UserOut)
def me(user: UserOut = Depends(get_current_user)):
    return user
