import axios from 'axios';

export const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log(`[API Response] ${response.config.url}`, response.status, response.data);
    return response;
  },
  error => {
    console.error('[API Error]', error.config?.url, error.message, error.response?.data);
    let userMessage = 'Неизвестная ошибка';
    
    if (error.code === 'ECONNABORTED') {
      userMessage = 'Сервер не отвечает (таймаут).';
    } else if (error.message === 'Network Error') {
      userMessage = 'Нет соединения с сервером.';
    } else if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      if (status === 401) userMessage = 'Не авторизован. Войдите заново.';
      else if (status === 403) userMessage = 'Доступ запрещён.';
      else if (status === 404) userMessage = 'Недопустимый маршрут. Попробуйте заново.';
      else if (data?.detail) {
        if (typeof data.detail === 'string') userMessage = data.detail;
        else if (Array.isArray(data.detail)) userMessage = data.detail.map(e => e.msg).join(', ');
        else userMessage = JSON.stringify(data.detail);
      } else userMessage = `Ошибка сервера: ${status}`;
    } else if (error.request) {
      userMessage = 'Сервер не доступен. Бывает.';
    } else {
      userMessage = error.message;
    }
    
    error.userMessage = userMessage;
    console.error('[Formatted Error]', userMessage);
    return Promise.reject(error);
  }
);

export async function fetchDocumentFileBlob(docId) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}/documents/${docId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = new Error('Не удалось загрузить файл документа');
    err.status = res.status;
    throw err;
  }
  return res.blob();
}

export default api;