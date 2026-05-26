from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    role: str

class RagAskSchema(BaseModel):
    query: str = Field(..., min_length=1)
    document_id: Optional[str] = None

class DocumentContentUpdateSchema(BaseModel):
    text: str = Field(..., min_length=1)