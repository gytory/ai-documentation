import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const emptyForm = { email: '', password: '' };

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setFormData(emptyForm);
    setError('');
    setSuccess('');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
      });
      setFormData(emptyForm);
      setSuccess('Регистрация успешна');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.userMessage || 'Ошибка регистрации');
    }
  };

  return (
    <div className="form-container">
      <h2>Регистрация</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
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
        <button type="submit" className="btn-primary">Зарегистрироваться</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}

export default Register;
