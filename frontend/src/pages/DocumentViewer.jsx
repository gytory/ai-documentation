import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { fetchDocumentFileBlob } from '../services/api';
import DocumentSearch from '../components/DocumentSearch';
import HighlightedText, { findMatchIndices } from '../components/HighlightedText';

function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const [meta, setMeta] = useState(null);
  const [text, setText] = useState('');
  const [editText, setEditText] = useState('');
  const [fileUrl, setFileUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatch, setActiveMatch] = useState(0);

  const isPdf = meta?.file_type === 'pdf';
  const showPdfView = isPdf && !isEditing && fileUrl;

  const matches = useMemo(
    () => findMatchIndices(isEditing ? editText : text, searchQuery),
    [text, editText, searchQuery, isEditing]
  );
  const matchCount = matches.length;

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const contentRes = await api.get(`/documents/${id}/content`);
      setMeta(contentRes.data);
      setText(contentRes.data.text || '');
      setEditText(contentRes.data.text || '');

      if (contentRes.data.file_type === 'pdf') {
        const blob = await fetchDocumentFileBlob(id);
        const url = URL.createObjectURL(blob);
        setFileUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        setFileUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
    } catch (err) {
      setError(err.userMessage || 'Не удалось открыть документ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocument();
    return () => {
      setFileUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [loadDocument]);

  useEffect(() => {
    const onKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    setActiveMatch(0);
  }, [searchQuery]);

  const searchInPdf = useCallback((forward = true) => {
    const win = iframeRef.current?.contentWindow;
    if (!win?.find || !searchQuery.trim()) return false;
    return win.find(searchQuery, false, false, forward);
  }, [searchQuery]);

  useEffect(() => {
    if (showPdfView && searchOpen && searchQuery.trim()) {
      searchInPdf(true);
    }
  }, [showPdfView, searchOpen, searchQuery, activeMatch, searchInPdf]);

  const goToMatch = direction => {
    if (matchCount === 0) return;
    setActiveMatch(prev => {
      const next =
        direction === 'next'
          ? (prev + 1) % matchCount
          : (prev - 1 + matchCount) % matchCount;
      if (showPdfView) {
        searchInPdf(direction === 'next');
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/documents/${id}/content`, { text: editText }, { timeout: 120000 });
      setText(editText);
      setIsEditing(false);
      setSuccess('Изменения сохранены');
    } catch (err) {
      setError(err.userMessage || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="form-container">Загрузка документа...</div>;
  }

  if (error && !meta) {
    return (
      <div className="form-container">
        <div className="error">{error}</div>
        <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
          Назад к списку
        </button>
      </div>
    );
  }

  return (
    <div className="document-view-page">
      <DocumentSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        matchCount={matchCount}
        activeIndex={activeMatch}
        onPrev={() => goToMatch('prev')}
        onNext={() => goToMatch('next')}
      />

      <div className="document-view-header">
        <div>
          <button type="button" className="btn-secondary btn-back" onClick={() => navigate('/')}>
            ← Назад
          </button>
          <h1>{meta?.title}</h1>
          {meta?.description && <p className="document-view-desc">{meta.description}</p>}
        </div>
        <div className="document-view-actions">
          <button type="button" className="btn-secondary" onClick={() => setSearchOpen(true)}>
            Поиск (Ctrl+F)
          </button>
          {meta?.can_edit && !isEditing && (
            <button type="button" className="btn-secondary" onClick={() => setIsEditing(true)}>
              Редактировать
            </button>
          )}
          {isEditing && (
            <>
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditText(text);
                  setIsEditing(false);
                }}
              >
                Отмена
              </button>
            </>
          )}
          <Link to={`/chat?doc=${id}`} className="btn-secondary btn-link-action">
            Спросить по документу
          </Link>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="document-viewer-wrap">
        {isEditing ? (
          <div className="document-sheet document-sheet--edit">
            <textarea
              className="document-edit-area"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              spellCheck
            />
          </div>
        ) : showPdfView ? (
          <div className="document-sheet document-sheet--pdf">
            <iframe
              ref={iframeRef}
              src={fileUrl}
              title={meta.title}
              className="document-pdf-frame"
            />
          </div>
        ) : (
          <div className="document-sheet">
            <HighlightedText
              text={text}
              query={searchQuery}
              activeIndex={activeMatch}
            />
          </div>
        )}
      </div>

      {showPdfView && searchQuery.trim() && matchCount > 0 && (
        <p className="document-search-hint">
          Подсветка в PDF: используйте кнопки ↑ ↓ в панели поиска (встроенный поиск браузера в окне документа).
          Текстовые совпадения: {matchCount}.
        </p>
      )}
    </div>
  );
}

export default DocumentViewer;
