import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const emptyDoc = { title: '', description: '', file: null };

function ManageDocuments() {
  const [docs, setDocs] = useState([]);
  const [showDocForm, setShowDocForm] = useState(false);
  const [newDoc, setNewDoc] = useState(emptyDoc);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formKey, setFormKey] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'moderator' && payload.role !== 'admin') navigate('/');
      } catch {
        navigate('/login');
      }
    } else navigate('/login');
    loadDocs();
  }, []);

  const loadDocs = () =>
    api
      .get('/documents')
      .then(res => setDocs(res.data))
      .catch(err => setError(err.userMessage || 'Не удалось загрузить список документов'));

  const openDocForm = () => {
    setError('');
    setSuccess('');
    setNewDoc(emptyDoc);
    setFormKey(Date.now());
    setShowDocForm(true);
  };

  const closeDocForm = () => {
    if (uploading) return;
    setShowDocForm(false);
    setError('');
    setNewDoc(emptyDoc);
    setFormKey(Date.now());
  };

  const uploadDoc = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setError('');
    setSuccess('');
    if (!newDoc.file) {
      setError('Выберите файл для загрузки');
      return;
    }
    const fd = new FormData();
    fd.append('title', newDoc.title);
    fd.append('description', newDoc.description || '');
    fd.append('file', newDoc.file);
    setUploading(true);
    try {
      await api.post('/documents', fd, { timeout: 300000 });
      setShowDocForm(false);
      setNewDoc(emptyDoc);
      setSuccess('Документ успешно загружен');
      loadDocs();
    } catch (err) {
      setError(err.userMessage || 'Ошибка загрузки документа');
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (id) => {
    if (!window.confirm('Удалить документ?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/documents/${id}`);
      setSuccess('Документ удалён');
      loadDocs();
    } catch (err) {
      setError(err.userMessage || 'Ошибка удаления документа');
    }
  };

  return (
    <div>
      <h1>Управление документами</h1>
      {error && !showDocForm && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <button type="button" className="btn-primary" onClick={openDocForm} disabled={uploading}>
        Загрузить документ
      </button>

      <h2>Список документов</h2>
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {docs.map(doc => (
            <tr key={doc.id}>
              <td>{doc.title}</td>
              <td>{doc.description || ''}</td>
              <td>
                <button type="button" className="btn-danger" onClick={() => deleteDoc(doc.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDocForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Загрузка документа</h3>
            {error && <div className="error">{error}</div>}
            <form key="doc-form" onSubmit={uploadDoc}>
              <input
                type="text"
                placeholder="Название"
                value={newDoc.title}
                onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                disabled={uploading}
                required
              />
              <textarea
                placeholder="Описание"
                value={newDoc.description}
                onChange={e => setNewDoc({ ...newDoc, description: e.target.value })}
                disabled={uploading}
              />
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                key={formKey}
                onChange={e => setNewDoc({ ...newDoc, file: e.target.files[0] || null })}
                disabled={uploading}
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="btn-primary" disabled={uploading}>
                  Загрузить
                </button>
                <button type="button" className="btn-secondary" onClick={closeDocForm} disabled={uploading}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploading && (
        <div className="modal modal--blocking">
          <div className="modal-content modal-content--loading">
            <div className="loading-spinner" />
            <h3>Загрузка и обработка документа</h3>
            <p>Извлекаем текст, строим индекс и эмбеддинги. Это может занять несколько минут.</p>
            <p className="loading-hint">Не закрывайте страницу и не отправляйте форму повторно.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageDocuments;
