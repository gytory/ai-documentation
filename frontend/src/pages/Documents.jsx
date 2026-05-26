import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/documents')
      .then(res => {
        setDocuments(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="form-container">Загрузка...</div>;

  return (
    <div>
      <h1>Корпоративные документы</h1>
      <div className="docs-grid">
        {documents.length === 0 ? (
          <p>Нет документов</p>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="doc-card" onClick={() => setSelectedDoc(doc)}>
              <div className="doc-icon">📄</div>
              <h3>{doc.title}</h3>
              <p className="doc-preview">{doc.description || ''}...</p>
            </div>
          ))
        )}
      </div>

      {selectedDoc && (
        <div className="modal" onClick={() => setSelectedDoc(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{selectedDoc.title}</h2>
            <p>{selectedDoc.description}</p>
            <div className="modal-buttons">
              <button type="button" className="btn-primary" onClick={() => {
                setSelectedDoc(null);
                navigate(`/documents/${selectedDoc.id}`);
              }}>
                Открыть документ
              </button>
              <button type="button" className="btn-secondary" onClick={() => {
                setSelectedDoc(null);
                navigate(`/chat?doc=${selectedDoc.id}`);
              }}>
                Спросить по документу
              </button>
              <button type="button" className="btn-secondary" onClick={() => setSelectedDoc(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Documents;