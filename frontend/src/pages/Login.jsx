import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const emptyForm = { email: '', password: '' };

function Login() {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(emptyForm);
    setError('');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      setFormData(emptyForm);
      localStorage.setItem('accessToken', response.data.accessToken);
      window.location.href = '/';
    } catch (err) {
      setError(err.userMessage || 'Ошибка входа');
    }
  };

  return (
    <div className="form-container">
      <h2>Вход в систему</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>
        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>
        <button type="submit" className="btn-primary">Войти</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}

export default Login;
