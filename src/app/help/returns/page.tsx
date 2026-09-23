import Link from "next/link";

export const metadata = {
  title: "RETURNS & EXCHANGES — BEROZGAR",
  description: "How to return or exchange a Berozgar order.",
};

const STEPS: [string, string][] = [
  ["RAISE IT", "Open the order in your account and choose Request Return or Request Exchange within 14 days of delivery."],
  ["PACK IT", "Put the piece back in its original packaging with the tags still attached."],
  ["HAND IT OVER", "We arrange pickup where the pin code supports it. Otherwise we'll send you a prepaid label."],
  ["INSPECTION", "We check the item is unworn and tagged. This usually takes a day or two after it reaches us."],
  ["RESOLVED", "Exchanges ship out once approved. Refunds go back to the original payment method."],
];

export default function ReturnsHelpPage() {
  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">SUPPORT</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>RETURNS &amp; EXCHANGES</h1>
        <p className="body mut" style={{ marginTop: "12px", maxWidth: "560px" }}>
          14-day returns and free size exchanges. Unworn, tags on.
        </p>
      </header>

      <div className="tl" data-rev="true">
        {STEPS.map(([title, copy], i) => (
          <div className="tl-i done" key={title}>
            <b>{String(i + 1).padStart(2, "0")} — {title}</b>
            <small>{copy}</small>
          </div>
        ))}
      </div>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">WHAT WE CAN&apos;T TAKE BACK</h2>
        <ul className="legal-list">
          <li>Anything worn, washed or altered</li>
          <li>Items with the tags removed</li>
          <li>Pieces returned after the 14-day window</li>
          <li>Items marked final sale at the time of purchase</li>
        </ul>
      </section>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">EXCHANGES</h2>
        <p className="body">
          Size exchanges are free and subject to stock in the size you want. If it&apos;s gone,
          we&apos;ll refund instead.
        </p>
      </section>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "28px" }}>
        <Link href="/account/orders" className="btn">GO TO MY ORDERS</Link>
        <Link href="/help/contact" className="btn btn-o">CONTACT SUPPORT</Link>
      </div>

      <p className="small mut" style={{ marginTop: "28px" }}>
        For the formal terms, see the{" "}
        <Link href="/legal/refund" className="tlink" style={{ border: 0 }}>RETURN &amp; REFUND POLICY</Link>.
      </p>
    </>
  );
}
