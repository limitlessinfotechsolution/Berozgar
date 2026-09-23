import Link from "next/link";
import { SectionNav } from "@/components/section-nav";
import { RevealObserver } from "@/components/reveal-observer";

const TABS: [string, string][] = [
  ["", "HELP CENTER"],
  ["contact", "CONTACT"],
  ["faq", "FAQ"],
  ["shipping", "SHIPPING"],
  ["returns", "RETURNS"],
  ["size-guide", "SIZE GUIDE"],
];

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap" style={{ padding: "40px 0 90px" }}>
        <div className="crumb">
          <Link href="/">HOME</Link> / HELP
        </div>
        <div className="acc-lay" style={{ marginTop: "20px" }}>
          <SectionNav base="/help" tabs={TABS} />
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
