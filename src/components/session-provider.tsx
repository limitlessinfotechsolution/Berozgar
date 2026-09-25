"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { accountApi, localPhone, type ApiResult, type Customer } from "@/lib/account-client";

/* What pages read about the signed-in shopper. Phone is the 10-digit local form. */
export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasPassword: boolean;
  marketingEmailOptIn: boolean;
  marketingWhatsappOptIn: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth?: string;
  acceptedPolicies: { slug: string; version: string }[];
  marketingOptIn: boolean;
};

type Result = ApiResult<{ customer: Customer }>;

type SessionContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  /* True until the session check has answered — gates redirects so a signed-in
     visitor isn't bounced to /login on the first paint. */
  loading: boolean;
  loginWithPassword: (identifier: string, password: string) => Promise<Result>;
  requestOtp: (phone: string, purpose?: "LOGIN" | "VERIFY_PHONE") => Promise<ApiResult<{ channel: string; resendAfter: number }>>;
  loginWithOtp: (phone: string, code: string, name?: string) => Promise<Result>;
  register: (input: RegisterInput) => Promise<Result>;
  logout: () => Promise<void>;
  /* Replace the cached shopper after a profile/phone/preferences change. */
  setCustomer: (customer: Customer | null) => void;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/* Left over from the old device-only session; removed so nothing stale lingers. */
const LEGACY_SESSION_KEY = "berozgar-session";

export function toUser(c: Customer): User {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? "",
    phone: localPhone(c.phone) || undefined,
    dob: c.dateOfBirth ?? undefined,
    emailVerified: c.emailVerified,
    phoneVerified: c.phoneVerified,
    hasPassword: c.hasPassword,
    marketingEmailOptIn: c.marketingEmailOptIn,
    marketingWhatsappOptIn: c.marketingWhatsappOptIn,
  };
}

/*
 * The shopper's session lives in the ERP (docs/INTEGRATION.md §Accounts). This server
 * keeps the token in an httpOnly cookie; the page only learns who is signed in.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await accountApi<{ customer: Customer }>("/api/auth/session");
    setCustomer(result.ok ? result.data.customer : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      /* storage blocked — nothing to clean */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the first session check has to run after mount
    void refresh();
  }, [refresh]);

  const signedIn = useCallback((result: Result) => {
    if (result.ok) setCustomer(result.data.customer);
    return result;
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user: customer ? toUser(customer) : null,
      isAuthenticated: customer !== null,
      loading,
      loginWithPassword: async (identifier, password) =>
        signedIn(await accountApi("/api/auth/login", { method: "POST", body: { identifier, password } })),
      requestOtp: (phone, purpose = "LOGIN") =>
        accountApi("/api/auth/otp/request", { method: "POST", body: { phone, purpose } }),
      loginWithOtp: async (phone, code, name) =>
        signedIn(
          await accountApi("/api/auth/otp/verify", {
            method: "POST",
            body: { phone, code, purpose: "LOGIN", ...(name ? { name } : {}) },
          }),
        ),
      register: async (input) =>
        signedIn(
          await accountApi("/api/auth/register", {
            method: "POST",
            body: { ...input, dateOfBirth: input.dateOfBirth || undefined },
          }),
        ),
      logout: async () => {
        await accountApi("/api/auth/logout", { method: "POST" });
        setCustomer(null);
      },
      setCustomer,
      refresh,
    }),
    [customer, loading, refresh, signedIn],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
