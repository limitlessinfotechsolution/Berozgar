import Link from "next/link";

export const metadata = {
  title: "RETURNS & EXCHANGES — BEROZGAR",
  description: "What to do if a Berozgar order arrives damaged, defective or wrong.",
};

/*
 * A plain-language walk through the Return, Replacement & Refund Policy
 * (/legal/refund, published from the ERP). The policy is the authority; the claim
 * window in days lives there, not here, so this page cannot drift from it.
 */
const STEPS: [string, string][] = [
  ["RAISE A CLAIM", "Open the order (My Orders or Track Order) and choose Request Return for a refund or Request Exchange for a free remake. Do it within the claim window after delivery."],
  ["ADD PHOTOS", "A clear photo of the fault, one of the whole item, and one of the shipping label. Keep the item and its packaging — don't wash or alter it."],
  ["WE REVIEW IT", "We reply within 2 working days, checking your photos against our quality-check record and the design you approved."],
  ["PICKUP IF NEEDED", "If we need the item back, we arrange the pickup and pay for it. You never pay return shipping for our mistake."],
  ["PUT RIGHT", "A replacement is remade to the same specification. A refund goes back the way you paid, with a credit note against your invoice."],
];

export default function ReturnsHelpPage() {
  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">SUPPORT</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>RETURNS &amp; EXCHANGES</h1>
        <p className="body mut" style={{ marginTop: "12px", maxWidth: "560px" }}>
          Every piece is printed to your design and size, so we can&apos;t take it back for a change of mind.
          If it arrives damaged, defective or wrong, we replace it or refund you.
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
        <h2 className="h3">WHAT A CLAIM COVERS</h2>
        <ul className="legal-list">
          <li>Damaged or stained on arrival</li>
          <li>A defective print — cracked, peeling, misaligned, faded — or a faulty garment</li>
          <li>The wrong size, colour, product or quantity against your confirmed order</li>
          <li>A print that doesn&apos;t match the design you approved</li>
          <li>Items missing from the parcel</li>
        </ul>
      </section>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">WHAT WE CAN&apos;T TAKE BACK</h2>
        <ul className="legal-list">
          <li>A change of mind, or a size you chose that doesn&apos;t fit — please use the size chart</li>
          <li>Anything that was in the mockup you approved: spelling, artwork, placement, colours</li>
          <li>Damage after delivery, such as the wrong washing or ironing, and normal wear</li>
          <li>Claims raised after the claim window has closed</li>
        </ul>
      </section>

      <section className="legal-sec" data-rev="true">
        <h2 className="h3">EXCHANGES</h2>
        <p className="body">
          An exchange is a free remake of the same item — same print, size and colour. It isn&apos;t a way to
          swap to a different size you prefer. If we can&apos;t remake it, we offer a close alternative or a refund.
        </p>
      </section>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "28px" }}>
        <Link href="/account/orders" className="btn">GO TO MY ORDERS</Link>
        <Link href="/track-order" className="btn btn-o">FIND AN ORDER</Link>
        <Link href="/help/contact" className="btn btn-o">CONTACT SUPPORT</Link>
      </div>

      <p className="small mut" style={{ marginTop: "28px" }}>
        For the formal terms, including the claim window, see the{" "}
        <Link href="/legal/refund" className="tlink" style={{ border: 0 }}>RETURN, REPLACEMENT &amp; REFUND POLICY</Link>.
      </p>
    </>
  );
}
