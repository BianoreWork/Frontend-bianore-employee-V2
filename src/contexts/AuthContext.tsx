import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types/api';

interface AuthState {
  token: string | null;
  user: User | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(() => ({
    token: localStorage.getItem('auth_token'),
    user: (() => {
      try {
        const raw = localStorage.getItem('auth_user');
        return raw ? (JSON.parse(raw) as User) : null;
      } catch {
        return null;
      }
    })(),
  }));

  const setAuth = (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuthState({ token, user });
  };

  const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setAuthState({ token: null, user: null });
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        setAuth,
        clearAuth,
        isAuthenticated: !!auth.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
