import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types';

const STORAGE_KEY = 'eaios_bp_token';
// Empty string → relative URLs → Vercel proxy routes to eaios-bp-api.onrender.com.
// Local dev: set REACT_APP_API_URL=http://localhost:8000 in frontend/.env.local
const BASE = process.env.REACT_APP_API_URL ?? '';

/**
 * Returns the stored JWT access token, or null if not logged in.
 * Used by api/client.ts to attach Authorization headers to every request.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Decode JWT payload (client-side only — no signature verification). */
function tokenToUser(token: string): User | null {
  try {
    // Fix base64url → base64 before decoding (JWT uses URL-safe alphabet without padding)
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    // Reject tokens with no exp claim or where exp is exceeded (exp is in seconds)
    if (!payload.exp || Date.now() / 1000 > (payload.exp as number)) return null;
    return {
      email: String(payload.sub ?? 'user'),
      loginTime: payload.iat
        ? new Date((payload.iat as number) * 1000).toISOString()
        : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function loadUserFromStorage(): User | null {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return null;
  const user = tokenToUser(token);
  if (!user) localStorage.removeItem(STORAGE_KEY); // clean up expired/invalid token
  return user;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(loadUserFromStorage);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setLoginError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);
    try {
      const form = new URLSearchParams();
      form.append('username', username);
      form.append('password', password);
      const res = await fetch(`${BASE}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(data.detail ?? 'Invalid username or password.');
      }
      const data = await res.json() as { access_token: string };
      localStorage.setItem(STORAGE_KEY, data.access_token);
      setUser(tokenToUser(data.access_token));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        const msg = 'Server is starting up — Render sleeps when idle. Please try again in 30 seconds.';
        setLoginError(msg);
        throw new Error(msg);
      }
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setLoginError(msg);
      throw err;
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setLoginError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, loginError, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
