import aiofiles
import os
import uuid
from pypdf import PdfReader
from docx import Document as DocxDocument

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_uploaded_file(file):
    ext = file.filename.split(".")[-1]
    new_name = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, new_name)
    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)
    return path

def delete_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)

def extract_text(file_path):
    ext = file_path.split(".")[-1].lower()
    try:
        if ext == "pdf":
            reader = PdfReader(file_path)
            return "\n".join([p.extract_text() or "" for p in reader.pages])
        elif ext == "docx":
            doc = DocxDocument(file_path)
            return "\n".join([p.text for p in doc.paragraphs])
        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
    except Exception:
        return ""
    return ""