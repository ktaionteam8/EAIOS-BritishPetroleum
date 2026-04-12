import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types';

const STORAGE_KEY = 'eaios_bp_user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_USER: User = { email: 'guest@bp.com', loginTime: new Date().toISOString() };

function loadUserFromStorage(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : GUEST_USER;
  } catch {
    return GUEST_USER;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(loadUserFromStorage);

  const login = useCallback((email: string) => {
    const newUser: User = { email, loginTime: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(GUEST_USER);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
