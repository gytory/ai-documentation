from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.user_service import get_all_users, get_user_by_id, create_user, delete_user, get_user_by_email, update_user_role
from auth import get_current_user
from schemas import UserCreateSchema
from models import User

router = APIRouter(prefix="/users", tags=["Пользователи"])

def _check_admin(user: User):
    if user.role != "admin":
        raise HTTPException(403, "Доступ запрещён. Требуется роль администратора")

@router.get("/")
def get_users_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_admin(current_user)
    users = get_all_users(db)
    return [{"id": str(u.id), "email": u.email, "role": u.role} for u in users]

@router.post("/")
def create_new_user(
    data: UserCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_admin(current_user)
    if get_user_by_email(db, data.email):
        raise HTTPException(400, "Пользователь с таким email уже существует")
    user = create_user(db, data.email, data.password, data.role)
    return {"id": str(user.id), "email": user.email, "role": user.role}

@router.delete("/{user_id}")
def delete_existing_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_admin(current_user)
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    delete_user(db, user)
    return {"message": "Пользователь удалён"}