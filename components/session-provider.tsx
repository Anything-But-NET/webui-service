"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/types";

interface SessionContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  refreshUser: () => Promise<SessionUser | null>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  initialUser: SessionUser | null;
  initialNeedsRefresh: boolean;
  children: ReactNode;
}

export function SessionProvider({
  initialUser,
  initialNeedsRefresh,
  children,
}: SessionProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(initialNeedsRefresh);

  const refreshUser = useCallback(async (): Promise<SessionUser | null> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        setUser(null);
        return null;
      }
      const data = (await response.json()) as { user: SessionUser };
      setUser(data.user);
      return data.user;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (!initialNeedsRefresh) return;

    let cancelled = false;
    async function syncCookies() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = (await response.json()) as { user: SessionUser };
        if (!cancelled) {
          setUser(data.user);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void syncCookies();
    return () => {
      cancelled = true;
    };
  }, [initialNeedsRefresh]);

  return (
    <SessionContext.Provider
      value={{ user, isLoading, setUser, refreshUser, logout }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
