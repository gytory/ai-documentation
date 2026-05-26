import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

function Chat() {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('doc');
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const historyEndRef = useRef(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const askQuestion = async () => {
    const q = question.trim();
    if (!q || sending) return;

    const msgId = Date.now();
    setQuestion('');
    setSending(true);
    setHistory(prev => [
      { id: msgId, q, a: null, pending: true, s: [] },
      ...prev,
    ]);

    try {
      const payload = { query: q };
      if (docId) payload.document_id = docId;

      const res = await api.post('/rag/ask', payload, { timeout: 180000 });
      setHistory(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, a: res.data.answer, pending: false, s: res.data.sources || [] }
            : m
        )
      );
    } catch (err) {
      setHistory(prev =>
        prev.map(m =>
          m.id === msgId
            ? {
                ...m,
                a: err.userMessage || 'Ошибка при запросе к нейросети',
                pending: false,
                s: [],
              }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="chat-page">
      <h1>{docId ? 'Чат по документу' : 'Чат по всем документам'}</h1>
      <div className="chat-history">
        {history.length === 0 ? (
          <div className="chat-message chat-message--empty">
            Задайте вопрос, чтобы начать
          </div>
        ) : (
          [...history].reverse().map(h => (
            <div key={h.id} className="chat-message">
              <div className="question">{h.q}</div>
              <div className={`answer ${h.pending ? 'answer--pending' : ''}`}>
                {h.pending ? 'Нейросеть формирует ответ...' : h.a}
              </div>
              {!h.pending && h.s?.length > 0 && (
                <div className="chat-sources">
                  Источники: {h.s.map(s => s.title).join(', ')}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={historyEndRef} />
      </div>
      <div className="chat-input">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows="2"
          placeholder="Задайте вопрос..."
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button type="button" onClick={askQuestion} disabled={sending || !question.trim()}>
          {sending ? '...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
}

export default Chat;
