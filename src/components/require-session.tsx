"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/session-provider";

/*
 * Client-side gate. The session check is a fetch to /api/auth/session, so this
 * waits for `loading` to clear before redirecting, otherwise a
 * signed-in visitor would be bounced to /login on the first paint.
 */
export function RequireSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useSession();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, pathname, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="empty" style={{ padding: "80px 0" }}>
        <p className="cap mut">{loading ? "LOADING…" : "REDIRECTING TO LOGIN…"}</p>
      </div>
    );
  }

  return <>{children}</>;
}
