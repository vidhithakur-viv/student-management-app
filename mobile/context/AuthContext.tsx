import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { setUnauthorizedHandler } from '@/services/api';
import { authApi } from '@/services/authApi';
import { User } from '@/types/auth';
import { tokenStorage } from '@/utils/tokenStorage';

interface AuthContextValue {
  user: User | null;
  /** true while the stored token is being checked at app start */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  // Restore session: validate any stored token with the backend.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          const me = await authApi.me();
          if (active) setUser(me);
        }
      } catch {
        // invalid/expired token or backend down -> show login
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // If any API call returns 401 (e.g. expired JWT) log the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email: email.trim().toLowerCase(), password });
    await tokenStorage.set(result.access_token);
    setUser(result.user);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
