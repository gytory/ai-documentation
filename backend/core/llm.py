import re
import httpx
from config import OLLAMA_URL, LLM_MODEL_NAME

OLLAMA_TIMEOUT = 180.0
NO_INFO_ANSWER = "В документах нет информации об этом."

SYSTEM_PROMPT = "Ты помощник. Отвечай на русском, используя документы. Деловой стиль."

def build_user_message(query: str, context: str) -> str:
    return f"Документы:\n{context}\n\nВопрос: {query}\n\nОтвет:"

def unique_sources_from_chunks(top_chunks):
    seen = set()
    sources = []
    for _, _, doc in top_chunks:
        if str(doc.id) not in seen:
            seen.add(str(doc.id))
            sources.append({"doc_id": str(doc.id), "title": doc.title})
    return sources

def build_context_from_chunks(top_chunks):
    parts = []
    for _, chunk, doc in top_chunks:
        parts.append(f"[{doc.title}]\n{chunk.chunk_text}")
    return "\n\n---\n\n".join(parts)

def clean_answer(raw: str, query: str) -> str:
    if not raw:
        return ""
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        if re.match(r'^[a-fA-F0-9]{20,}$', line):
            continue
        if re.search(r'ysclid=|yclid=', line):
            continue
        lines.append(line)
    return "\n".join(lines)

async def _resolve_model(client: httpx.AsyncClient) -> str:
    try:
        resp = await client.get(f"{OLLAMA_URL}/api/tags")
        resp.raise_for_status()
        models = resp.json().get("models", [])
        if not models:
            raise RuntimeError("Не установлена модель")
        names = [m["name"] for m in models if m.get("name")]
        preferred = LLM_MODEL_NAME
        for name in names:
            if name == preferred or name.startswith(f"{preferred}:"):
                return name
        return names[0]
    except httpx.ConnectError:
        raise RuntimeError("Модель не запущена.")

def _llm_options():
    return {
        "temperature": 0.3,
        "top_p": 0.95,
        "repeat_penalty": 1.0,
        "num_predict": 600,
    }

async def ask_llm(system: str, user: str) -> str:
    async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
        model = await _resolve_model(client)
        options = _llm_options()
        payload = {
            "model": model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "stream": False,
            "options": options,
        }
        try:
            resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            if resp.status_code == 200:
                content = resp.json().get("message", {}).get("content", "").strip()
                if content:
                    return content
        except Exception:
            pass
        gen_payload = {
            "model": model,
            "prompt": f"{system}\n\n{user}",
            "stream": False,
            "options": options,
        }
        resp = await client.post(f"{OLLAMA_URL}/api/generate", json=gen_payload)
        resp.raise_for_status()
        text = resp.json().get("response", "").strip()
        if not text:
            raise RuntimeError("Пустой ответ")
        return text

def _clean_chunk_text(raw: str) -> str:
    if not raw:
        return ""
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        if re.match(r'^[a-fA-F0-9]{20,}$', line):
            continue
        if re.search(r'ysclid=|yclid=', line):
            continue
        lines.append(line)
    return "\n".join(lines)

def fallback_from_chunks(top_chunks, max_fragments=3):
    if not top_chunks:
        return NO_INFO_ANSWER
    fragments = []
    seen = set()
    for _, chunk, doc in top_chunks[:max_fragments]:
        clean = _clean_chunk_text(chunk.chunk_text)
        if not clean or clean in seen:
            continue
        seen.add(clean)
        fragments.append(f"Из документа «{doc.title}»:\n{clean}")
    if not fragments:
        return NO_INFO_ANSWER
    return ("Ответ не был сформирован. Приведена выдержка из текста. "
            "Просьба учесть, что ответ может не содержать сути изначального вопроса.\n\n"
            + "\n\n".join(fragments))

async def generate_answer(query: str, context: str, top_chunks=None):
    try:
        raw = await ask_llm(SYSTEM_PROMPT, build_user_message(query, context))
        answer = clean_answer(raw, query)
        if answer:
            return answer
    except Exception:
        pass
    if top_chunks:
        return fallback_from_chunks(top_chunks)
    return NO_INFO_ANSWER