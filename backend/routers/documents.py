import mimetypes
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from documents import extract_text, save_uploaded_file, delete_file
from core.chunking import create_chunks_with_embeddings
from auth import get_current_user
from models import User
from schemas import DocumentContentUpdateSchema
from services.document_service import (
    get_all_documents, get_document_by_id, create_document, delete_document,
    save_chunks, get_document_text, get_file_extension, update_document_text, replace_chunks
)

router = APIRouter(prefix="/documents", tags=["Документы"])

def _check_moderator(user: User):
    if user.role not in ["admin", "moderator"]:
        raise HTTPException(403, "Доступ запрещён. Требуется роль модератора или администратора")

@router.get("/")
def get_documents_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = get_all_documents(db)
    return [{"id": str(d.id), "title": d.title, "description": d.description} for d in docs]

@router.get("/{doc_id}")
def get_document_info(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = get_document_by_id(db, doc_id)
    if not doc:
        raise HTTPException(404, "Документ не найден")
    return {"id": str(doc.id), "title": doc.title, "description": doc.description, "file_path": doc.file_path}

@router.get("/{doc_id}/content")
def get_document_content(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = get_document_by_id(db, doc_id)
    if not doc:
        raise HTTPException(404, "Документ не найден")
    text = get_document_text(doc)
    if not doc.text_content and text:
        doc.text_content = text
        db.commit()
    file_type = get_file_extension(doc.file_path)
    return {
        "id": str(doc.id),
        "title": doc.title,
        "description": doc.description,
        "text": text,
        "file_type": file_type,
        "can_edit": current_user.role in ("admin", "moderator"),
    }

@router.put("/{doc_id}/content")
def update_document_content(
    doc_id: str,
    data: DocumentContentUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_moderator(current_user)
    doc = get_document_by_id(db, doc_id)
    if not doc:
        raise HTTPException(404, "Документ не найден")
    try:
        update_document_text(db, doc, data.text)
        chunks_data = create_chunks_with_embeddings(data.text)
        replace_chunks(db, doc.id, chunks_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Ошибка сохранения: {str(e)}")
    return {"message": "Документ обновлён", "id": str(doc.id)}

@router.get("/{doc_id}/file")
def get_document_file(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = get_document_by_id(db, doc_id)
    if not doc:
        raise HTTPException(404, "Документ не найден")
    if not os.path.exists(doc.file_path):
        raise HTTPException(404, "Файл не найден на сервере")
    media_type, _ = mimetypes.guess_type(doc.file_path)
    filename = os.path.basename(doc.file_path)
    return FileResponse(
        doc.file_path,
        media_type=media_type or "application/octet-stream",
        filename=filename,
    )

@router.post("/")
async def upload_document(
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_moderator(current_user)
    
    allowed = [".pdf", ".docx", ".txt"]
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(400, "Неподдерживаемый формат. Разрешены: PDF, DOCX, TXT")
    
    file_path = await save_uploaded_file(file)
    
    try:
        raw_text = extract_text(file_path)
        if not raw_text:
            raise HTTPException(400, "Не удалось извлечь текст из файла")
        
        chunks_data = create_chunks_with_embeddings(raw_text)
        doc = create_document(db, title, description, file_path, str(current_user.id), raw_text)
        save_chunks(db, doc.id, chunks_data)
    except HTTPException:
        delete_file(file_path)
        db.rollback()
        raise
    except Exception as e:
        delete_file(file_path)
        db.rollback()
        raise HTTPException(500, f"Ошибка обработки документа: {str(e)}")
    
    return {"id": str(doc.id), "title": doc.title}

@router.delete("/{doc_id}")
def delete_existing_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_moderator(current_user)
    doc = get_document_by_id(db, doc_id)
    if not doc:
        raise HTTPException(404, "Документ не найден")
    delete_file(doc.file_path)
    delete_document(db, doc)
    return {"message": "Документ удалён"}