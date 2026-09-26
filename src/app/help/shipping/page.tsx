import Link from "next/link";
import { formatINR } from "@/lib/money";
import { getShippingRule } from "@/lib/settings";

export const metadata = {
  title: "SHIPPING & DELIVERY — BEROZGAR",
  description: "Dispatch windows, delivery estimates and shipping charges.",
};

export default async function ShippingHelpPage() {
  /* Charges from the ERP's Settings → Shipping — the numbers the checkout quote uses. */
  const rule = await getShippingRule();
  const RATES: [string, string, string][] = [
    ["STANDARD", "3–5 WORKING DAYS", `FREE above ${formatINR(rule.freeFromMinor)}, otherwise ${formatINR(rule.standardMinor)}`],
    ["EXPRESS", "1–2 WORKING DAYS", `+${formatINR(rule.expressMinor)}`],
  ];

  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">SUPPORT</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>SHIPPING &amp; DELIVERY</h1>
        <p className="body mut" style={{ marginTop: "12px", maxWidth: "560px" }}>
          Everything ships from Mumbai. Orders are dispatched within 24 hours.
        </p>
      </header>

      <div data-rev="true">
        {RATES.map(([name, speed, cost]) => (
          <div className="del-opt" key={name} style={{ cursor: "default" }}>
            <div>
              <b className="small" style={{ letterSpacing: "0.1em" }}>{name}</b>
              <small className="small mut" style={{ display: "block" }}>{speed}</small>
            </div>
            <b className="price">{cost}</b>
          </div>
        ))}
      </div>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">DISPATCH</h2>
        <p className="body">
          Orders placed before 14:00 IST on a working day are usually dispatched the same day.
          Everything else goes out within 24 hours. Drops can add a day at peak.
        </p>
      </section>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">WHERE WE DELIVER</h2>
        <p className="body">
          We ship across India. Metro pin codes are typically the fast end of the window; remote
          and north-eastern pin codes can take a couple of days longer.
        </p>
        <p className="body">We don&apos;t ship internationally yet.</p>
      </section>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">TRACKING</h2>
        <p className="body">
          You&apos;ll get a tracking link when the order leaves us. You can also follow it from{" "}
          <Link href="/track-order" className="tlink" style={{ border: 0 }}>TRACK ORDER</Link> or
          from your account.
        </p>
      </section>

      <p className="small mut" style={{ marginTop: "32px" }}>
        For the formal terms, see the{" "}
        <Link href="/legal/shipping" className="tlink" style={{ border: 0 }}>SHIPPING POLICY</Link>.
      </p>
    </>
  );
}
