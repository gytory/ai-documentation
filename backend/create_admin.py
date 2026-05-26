from database import SessionLocal
from services.user_service import create_user

def create_admin():
    db = SessionLocal()
    try:
        user = create_user(db, "nd@gmail.com", "123456", role="admin")
        print(f"Admin created: {user.email} with role {user.role}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()