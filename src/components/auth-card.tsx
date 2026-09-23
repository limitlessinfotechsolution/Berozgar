import Link from "next/link";
import { RevealObserver } from "@/components/reveal-observer";

/* Shared shell for login / register / forgot-password. */
export function AuthCard({
  eyebrow,
  title,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "48px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / {eyebrow}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
          <div style={{ width: "100%", maxWidth: "560px" }}>
            <header style={{ marginBottom: "24px" }}>
              <p className="eyebrow mut">{eyebrow}</p>
              <h1 className="h1" style={{ marginTop: "10px" }}>{title}</h1>
            </header>

            <div className="sfind" data-rev="true" style={{ maxWidth: "none" }}>
              {children}
            </div>

            {footer && <div style={{ marginTop: "20px" }}>{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
