from sqlalchemy.orm import Session
from models import User
from auth import hash_password
import uuid

def get_all_users(db: Session):
    return db.query(User).all()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, email: str, password: str, role: str = "user"):
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password(password),
        role=role
    )
    db.add(user)
    db.commit()
    return user

def update_user_role(db: Session, user: User, role: str):
    user.role = role
    db.commit()
    return user

def delete_user(db: Session, user: User):
    db.delete(user)
    db.commit()