from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
from routers import auth, users, documents, rag


app = FastAPI(title="Корпоративный помощник", version="1.0.0")

@app.on_event("startup")
def run_migrations():
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS text_content TEXT"
        ))
        conn.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(rag.router)

@app.get("/")
def root():
    return {"message": "API работает", "status": "ok"}