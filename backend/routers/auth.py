from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.user_service import get_user_by_email, create_user
from auth import verify_password, create_access_token
from schemas import UserRegisterSchema, UserLoginSchema

router = APIRouter(prefix="/auth", tags=["Авторизация"])

@router.post("/register")
def register(data: UserRegisterSchema, db: Session = Depends(get_db)):
    if get_user_by_email(db, data.email):
        raise HTTPException(400, "Пользователь с таким email уже существует")
    user = create_user(db, data.email, data.password)
    return {"id": str(user.id), "email": user.email, "role": user.role}

@router.post("/login")
def login(data: UserLoginSchema, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"accessToken": token, "role": user.role}