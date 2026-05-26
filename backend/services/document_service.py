from sqlalchemy.orm import Session
from models import Document, Chunk
from documents import extract_text
import uuid
import os

def get_all_documents(db: Session):
    return db.query(Document).all()

def get_document_by_id(db: Session, doc_id: str):
    return db.query(Document).filter(Document.id == doc_id).first()

def get_document_text(doc: Document) -> str:
    if doc.text_content:
        return doc.text_content
    return extract_text(doc.file_path) or ""

def get_file_extension(file_path: str) -> str:
    return file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""

def create_document(db: Session, title: str, description: str, file_path: str, user_id: str, text_content: str = ""):
    doc = Document(
        id=uuid.uuid4(),
        title=title,
        description=description,
        file_path=file_path,
        text_content=text_content or None,
        uploaded_by=user_id
    )
    db.add(doc)
    db.flush()
    return doc

def update_document_text(db: Session, doc: Document, text: str):
    doc.text_content = text
    ext = get_file_extension(doc.file_path)
    if ext == "txt" and os.path.exists(doc.file_path):
        with open(doc.file_path, "w", encoding="utf-8") as f:
            f.write(text)
    db.query(Chunk).filter(Chunk.document_id == doc.id).delete()
    db.flush()
    return doc

def replace_chunks(db: Session, doc_id, chunks_data: list):
    db.query(Chunk).filter(Chunk.document_id == doc_id).delete()
    db.flush()
    for chunk_info in chunks_data:
        chunk = Chunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=chunk_info["index"],
            chunk_text=chunk_info["text"],
            embedding=chunk_info["embedding"]
        )
        db.add(chunk)
    db.commit()

def delete_document(db: Session, doc: Document):
    db.delete(doc)
    db.commit()

def save_chunks(db: Session, doc_id: str, chunks_data: list):
    for chunk_info in chunks_data:
        chunk = Chunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=chunk_info["index"],
            chunk_text=chunk_info["text"],
            embedding=chunk_info["embedding"]
        )
        db.add(chunk)
    db.commit()