import Link from "next/link";

export const metadata = {
  title: "HELP CENTER — BEROZGAR",
  description: "Orders, payments, shipping, returns, exchanges, products and account help.",
};

/* Spec §29 categories. Each points at the page that actually answers it. */
const CATEGORIES: { title: string; copy: string; href: string }[] = [
  { title: "ORDERS", copy: "Track a drop, change an order, or check what shipped.", href: "/track-order" },
  { title: "PAYMENTS", copy: "UPI, cards, net banking, wallets and cash on delivery.", href: "/help/faq" },
  { title: "SHIPPING", copy: "Dispatch windows, delivery estimates and charges.", href: "/help/shipping" },
  { title: "RETURNS", copy: "14-day returns — what qualifies and how to start one.", href: "/help/returns" },
  { title: "EXCHANGES", copy: "Free size exchanges on unworn pieces with tags on.", href: "/help/returns" },
  { title: "PRODUCTS", copy: "Fabric weights, fits, sizing and care.", href: "/help/size-guide" },
  { title: "ACCOUNT", copy: "Sign in, addresses, wishlist and profile settings.", href: "/account" },
];

export default function HelpCenterPage() {
  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">SUPPORT</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>HELP CENTER</h1>
        <p className="body mut" style={{ marginTop: "12px", maxWidth: "560px" }}>
          Straight answers, no runaround. Pick a topic or{" "}
          <Link href="/help/contact" className="tlink" style={{ border: 0 }}>talk to us</Link>.
        </p>
      </header>

      <div className="grid2" data-rev="true">
        {CATEGORIES.map((category) => (
          <Link key={category.title} className="addr-card" href={category.href} style={{ display: "block" }}>
            <h2 className="cap" style={{ marginBottom: "8px" }}>{category.title}</h2>
            <p className="small mut">{category.copy}</p>
          </Link>
        ))}
      </div>

      <div className="addr-card" style={{ marginTop: "24px" }} data-rev="true">
        <h2 className="cap" style={{ marginBottom: "8px" }}>STILL STUCK?</h2>
        <p className="small mut" style={{ marginBottom: "14px" }}>
          We answer every message. Monday to Saturday, 10:00–18:00 IST.
        </p>
        <Link href="/help/contact" className="btn btn-o">CONTACT SUPPORT</Link>
      </div>
    </>
  );
}
