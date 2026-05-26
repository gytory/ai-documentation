import re
from core.embeddings import get_embedding

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list:
    if not text:
        return []
    text = re.sub(r'\s+', ' ', text).strip()
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        if end < len(text):
            last_period = max(text.rfind('.', start, end),
                            text.rfind('!', start, end),
                            text.rfind('?', start, end))
            if last_period > start:
                end = last_period + 1
        chunk = text[start:end]
        if chunk:
            chunks.append(chunk)
        start = end - overlap if end - overlap > start else end
    return chunks

def create_chunks_with_embeddings(text: str):
    chunks_text = chunk_text(text)
    chunks_data = []
    for i, chunk_text_value in enumerate(chunks_text):
        embedding = get_embedding(chunk_text_value)
        chunks_data.append({
            "index": i,
            "text": chunk_text_value,
            "embedding": embedding
        })
    return chunks_data