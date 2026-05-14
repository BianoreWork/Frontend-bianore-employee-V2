const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Something went wrong. Please try again.' }));
    throw new ApiError(res.status, body.message || 'Something went wrong.');
  }

  return res.json() as Promise<T>;
}

async function requestForm<T>(endpoint: string, body: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { method, body, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Something went wrong. Please try again.' }));
    throw new ApiError(res.status, err.message || 'Something went wrong.');
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  postForm: <T>(endpoint: string, body: FormData) => requestForm<T>(endpoint, body),
  putForm:  <T>(endpoint: string, body: FormData) => requestForm<T>(endpoint, body, 'PUT'),
};
