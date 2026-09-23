"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useHydrated, readStored, writeStored } from "@/lib/use-hydrated";

export type User = {
  name: string;
  email: string;
  phone?: string;
  dob?: string;
};

type SessionContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  /* True until localStorage has been read — gates redirect so we don't bounce
     a signed-in visitor to /login on the first paint. */
  loading: boolean;
  login: (email: string) => User;
  register: (user: User) => User;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
};

const SESSION_KEY = "berozgar-session";

const SessionContext = createContext<SessionContextValue | null>(null);

/*
 * Front-end-only session, consistent with the rest of this app (cart, wishlist
 * and orders are all local too). There is no password check and nothing is
 * verified — swap the bodies of login/register for real API calls when a
 * backend exists. That is the only place that needs to change.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const [user, setUser] = useState<User | null>(() => readStored<User | null>(SESSION_KEY, null));

  useEffect(() => { writeStored(SESSION_KEY, user); }, [user]);

  const visibleUser = hydrated ? user : null;

  function login(email: string) {
    const existing = readStored<User | null>(SESSION_KEY, null);
    const next: User =
      existing && existing.email === email
        ? existing
        : { name: email.split("@")[0].toUpperCase(), email };
    setUser(next);
    return next;
  }

  function register(newUser: User) {
    setUser(newUser);
    return newUser;
  }

  function logout() {
    setUser(null);
  }

  function updateUser(patch: Partial<User>) {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }

  return (
    <SessionContext.Provider
      value={{
        user: visibleUser,
        isAuthenticated: visibleUser !== null,
        loading: !hydrated,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
