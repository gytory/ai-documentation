from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from core.embeddings import cosine_similarity, get_embedding
from core.llm import (
    generate_answer,
    build_context_from_chunks,
    unique_sources_from_chunks,
    NO_INFO_ANSWER,
)
from auth import get_current_user
from models import User, Chunk, Document
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG"])


class RagAskRequest(BaseModel):
    query: str
    document_id: Optional[str] = None


@router.post("/ask")
async def ask_question(
    data: RagAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not data.query.strip():
        raise HTTPException(400, "Вопрос не может быть пустым")

    try:
        query_embedding = get_embedding(data.query)
    except Exception as e:
        logger.exception("Embedding error")
        raise HTTPException(500, f"Ошибка векторизации запроса: {str(e)}")

    query_chunks = db.query(Chunk, Document).join(
        Document, Chunk.document_id == Document.id
    )
    if data.document_id:
        query_chunks = query_chunks.filter(Chunk.document_id == data.document_id)

    all_chunks = query_chunks.all()

    if not all_chunks:
        return {
            "answer": "В системе пока нет проиндексированных документов. Попросите модератора обновить базу.",
            "sources": [],
        }

    scored = []
    for chunk, doc in all_chunks:
        if not chunk.embedding:
            continue
        try:
            similarity = cosine_similarity(query_embedding, chunk.embedding)
        except Exception:
            continue
        scored.append((similarity, chunk, doc))

    scored.sort(reverse=True, key=lambda x: x[0])
    top_chunks = scored[:5]

    if not top_chunks or top_chunks[0][0] < 0.1:
        return {
            "answer": NO_INFO_ANSWER,
            "sources": [],
        }

    context = build_context_from_chunks(top_chunks)
    sources = unique_sources_from_chunks(top_chunks)

    try:
        answer = await generate_answer(data.query, context, top_chunks=top_chunks)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        logger.exception("LLM error")
        raise HTTPException(500, f"Ошибка нейросети: {str(e)}")

    return {"answer": answer, "sources": sources}
