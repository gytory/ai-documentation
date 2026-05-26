import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const isAuth = !!localStorage.getItem('accessToken');

  useEffect(() => {
    if (isAuth) {
      try {
        const token = localStorage.getItem('accessToken');
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role);
      } catch {
        setRole(null);
      }
    }
  }, [isAuth]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">Корпоративная документация</Link>
      <div className="nav-links">
        {isAuth ? (
          <>
            <Link to="/">Документы</Link>
            <Link to="/chat">Задать вопрос</Link>
            {(role === 'moderator' || role === 'admin') && (
              <Link to="/documents/manage">Работа с документами</Link>
            )}
            {role === 'admin' && (
              <Link to="/admin">Админинстрирование</Link>
            )}
            <span style={{ color: 'var(--accent)' }}>
              {role === 'admin' ? 'Администратор' : role === 'moderator' ? 'Модератор' : 'Пользователь'}
            </span>
            <button className="btn-outline" onClick={handleLogout}>Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;