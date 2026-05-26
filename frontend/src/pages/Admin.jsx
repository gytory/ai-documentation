import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const emptyUser = { email: '', password: '', role: 'user' };

function Admin() {
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState(emptyUser);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'admin') navigate('/');
      } catch {
        navigate('/login');
      }
    } else navigate('/login');
    loadUsers();
  }, []);

  const loadUsers = () =>
    api
      .get('/users')
      .then(res => setUsers(res.data))
      .catch(err => setError(err.userMessage || 'Не удалось загрузить список пользователей'));

  const openUserForm = () => {
    setError('');
    setSuccess('');
    setNewUser(emptyUser);
    setShowUserForm(true);
  };

  const closeUserForm = () => {
    setShowUserForm(false);
    setError('');
    setNewUser(emptyUser);
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/users', {
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });
      closeUserForm();
      setSuccess('Пользователь успешно создан');
      loadUsers();
    } catch (err) {
      setError(err.userMessage || 'Ошибка создания пользователя');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/${id}`);
      setSuccess('Пользователь удалён');
      loadUsers();
    } catch (err) {
      setError(err.userMessage || 'Ошибка удаления пользователя');
    }
  };

  return (
    <div>
      <h1>Управление пользователями</h1>
      {error && !showUserForm && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <button type="button" className="btn-primary" onClick={openUserForm}>
        Добавить пользователя
      </button>

      <h2>Пользователи</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Роль</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button type="button" className="btn-danger" onClick={() => deleteUser(u.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showUserForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Новый пользователь</h3>
            {error && <div className="error">{error}</div>}
            <form key="user-form" onSubmit={createUser} autoComplete="off">
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                autoComplete="off"
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                autoComplete="new-password"
                required
              />
              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="user">Пользователь</option>
                <option value="moderator">Модератор</option>
                <option value="admin">Администратор</option>
              </select>
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  Создать
                </button>
                <button type="button" className="btn-secondary" onClick={closeUserForm}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
