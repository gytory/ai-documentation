export function getTokenPayload() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function getUserRole() {
  return getTokenPayload()?.role || 'user';
}

export function isModeratorOrAdmin() {
  const role = getUserRole();
  return role === 'moderator' || role === 'admin';
}
