import React, { useEffect, useRef } from 'react';

function DocumentSearch({
  open,
  onClose,
  query,
  onQueryChange,
  matchCount,
  activeIndex,
  onPrev,
  onNext,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  if (!open) return null;

  const counter =
    !query.trim() ? '—' : matchCount === 0 ? 'Нет совпадений' : `${activeIndex + 1} из ${matchCount}`;

  return (
    <div className="doc-search-bar" onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        placeholder="Найти в документе..."
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.shiftKey ? onPrev() : onNext();
          }
          if (e.key === 'Escape') onClose();
        }}
      />
      <span className="doc-search-counter">{counter}</span>
      <button type="button" className="doc-search-btn" onClick={onPrev} title="Предыдущее (Shift+Enter)">
        ↑
      </button>
      <button type="button" className="doc-search-btn" onClick={onNext} title="Следующее (Enter)">
        ↓
      </button>
      <button type="button" className="doc-search-btn doc-search-close" onClick={onClose} title="Закрыть (Esc)">
        ✕
      </button>
    </div>
  );
}

export default DocumentSearch;
