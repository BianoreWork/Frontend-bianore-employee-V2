import type { User } from '../types/api';

export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

export function getStoredToken() {
  return localStorage.getItem('auth_token');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function storeAuthSession(token: string, user: User) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function clearStoredAuthSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function notifyAuthSessionExpired() {
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}
