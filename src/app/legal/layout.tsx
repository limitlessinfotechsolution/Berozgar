import Link from "next/link";
import { SectionNav } from "@/components/section-nav";
import { RevealObserver } from "@/components/reveal-observer";

const TABS: [string, string][] = [
  ["terms", "TERMS"],
  ["privacy", "PRIVACY"],
  ["refund", "RETURN & REFUND"],
  ["cancellation", "CANCELLATION"],
  ["shipping", "SHIPPING"],
  ["ip", "YOUR ARTWORK"],
  ["bulk", "BULK ORDERS"],
  ["cookies", "COOKIES"],
  ["disclaimer", "DISCLAIMER"],
  ["grievance", "GRIEVANCES"],
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "40px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / LEGAL
        </div>
        <div className="acc-lay" style={{ marginTop: "20px" }}>
          <SectionNav base="/legal" tabs={TABS} />
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
