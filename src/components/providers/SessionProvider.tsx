"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SessionProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  permissions: string[];
}

interface SessionContextValue {
  user: SessionProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  error: null,
  refresh: async () => {},
});
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok)
        throw new Error(
          "Session could not be checked. Please try signing in again.",
        );
      const data = await response.json();
      setUser(data.authenticated && data.user ? data.user : null);
    } catch (cause) {
      setUser(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Session could not be checked.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <SessionContext.Provider value={{ user, loading, error, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  return useContext(SessionContext);
}
