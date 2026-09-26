import { AccountNav } from "@/components/account-nav";
import { RevealObserver } from "@/components/reveal-observer";

export const metadata = {
  title: "ACCOUNT — BEROZGAR",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ paddingTop: "40px", paddingBottom: "90px" }}>
        <div className="acc-lay">
          <AccountNav />
          {/* Each page awaits verifySession() (src/lib/dal.ts) — a layout doesn't re-render
              between account pages, so the check can't live here. src/proxy.ts turns away
              requests with no session cookie before anything renders. */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
