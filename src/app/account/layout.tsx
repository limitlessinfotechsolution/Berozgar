import { AccountNav } from "@/components/account-nav";
import { RevealObserver } from "@/components/reveal-observer";
import { RequireSession } from "@/components/require-session";

export const metadata = {
  title: "ACCOUNT — BEROZGAR",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "40px 0 90px" }}>
        <div className="acc-lay">
          <AccountNav />
          <div><RequireSession>{children}</RequireSession></div>
        </div>
      </div>
    </div>
  );
}
