import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Простой компонент логина для теста
const Login = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    // имитация успешного входа
    if (email === 'test@test.com' && password === '123456') {
      localStorage.setItem('accessToken', 'fake-token');
      window.location.href = '/';
    } else {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div>
      <h2>Вход в систему</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit">Войти</button>
      </form>
    </div>
  );
};

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.location;
    window.location = { href: '' };
  });

  test('отображает форму входа', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByText('Вход в систему')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByText('Войти')).toBeInTheDocument();
  });

  test('показывает ошибку при пустых полях', async () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.click(screen.getByText('Войти'));
    expect(screen.getByText('Заполните все поля')).toBeInTheDocument();
  });

  test('показывает ошибку при коротком пароле', async () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Войти'));
    expect(screen.getByText('Пароль должен быть не менее 6 символов')).toBeInTheDocument();
  });
});