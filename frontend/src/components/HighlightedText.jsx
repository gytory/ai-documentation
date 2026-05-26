import React, { useMemo, useEffect, useRef } from 'react';

function findMatchIndices(text, query) {
  if (!query.trim() || !text) return [];
  const indices = [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let pos = 0;
  while ((pos = lower.indexOf(q, pos)) !== -1) {
    indices.push(pos);
    pos += q.length;
  }
  return indices;
}

function HighlightedText({ text, query, activeIndex }) {
  const activeRef = useRef(null);
  const indices = useMemo(() => findMatchIndices(text, query), [text, query]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, query, text]);

  if (!query.trim() || indices.length === 0) {
    return <pre className="document-text">{text}</pre>;
  }

  const qLen = query.length;
  const parts = [];
  let last = 0;
  indices.forEach((start, i) => {
    if (start > last) {
      parts.push({ type: 'text', value: text.slice(last, start), key: `t-${start}` });
    }
    parts.push({
      type: 'mark',
      value: text.slice(start, start + qLen),
      index: i,
      key: `m-${start}`,
    });
    last = start + qLen;
  });
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last), key: 't-end' });
  }

  return (
    <pre className="document-text">
      {parts.map(part =>
        part.type === 'mark' ? (
          <mark
            key={part.key}
            ref={part.index === activeIndex ? activeRef : null}
            className={part.index === activeIndex ? 'search-highlight active' : 'search-highlight'}
          >
            {part.value}
          </mark>
        ) : (
          <span key={part.key}>{part.value}</span>
        )
      )}
    </pre>
  );
}

export { findMatchIndices };
export default HighlightedText;
