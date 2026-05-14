import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types/api';
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearStoredAuthSession,
  getStoredToken,
  getStoredUser,
  storeAuthSession,
} from '../lib/authSession';

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
    token: getStoredToken(),
    user: getStoredUser(),
  }));

  const setAuth = (token: string, user: User) => {
    storeAuthSession(token, user);
    setAuthState({ token, user });
  };

  const clearAuth = () => {
    clearStoredAuthSession();
    setAuthState({ token: null, user: null });
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      setAuthState({ token: null, user: null });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'auth_token' && event.newValue === null) {
        setAuthState({ token: null, user: null });
      }
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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
