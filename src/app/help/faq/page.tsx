import { FaqAccordion, type FaqGroup } from "@/components/faq-accordion";

export const metadata = {
  title: "FAQ — BEROZGAR",
  description: "Frequently asked questions about orders, shipping, returns and sizing.",
};

/* Answers mirror the promises already made elsewhere on the site (PDP notes,
   shipping band, returns copy) so the two can't drift apart. */
const GROUPS: FaqGroup[] = [
  {
    category: "ORDERS",
    items: [
      ["WHEN DOES MY ORDER SHIP?", "Orders are dispatched within 24 hours of being placed. You'll get a tracking link as soon as it leaves us."],
      ["CAN I CHANGE OR CANCEL AN ORDER?", "If it hasn't been packed yet, yes. Contact support with your order ID as soon as possible and we'll try to catch it."],
      ["HOW DO I TRACK MY ORDER?", "Use the Track Order page with your order ID, or open the order from your account."],
    ],
  },
  {
    category: "PAYMENTS",
    items: [
      ["WHAT PAYMENT METHODS DO YOU TAKE?", "UPI (GPay, PhonePe, Paytm), credit and debit cards, net banking, wallets, and cash on delivery."],
      ["IS CASH ON DELIVERY AVAILABLE?", "Yes, on eligible pin codes. You pay when the order arrives."],
      ["MY PAYMENT FAILED BUT I WAS CHARGED.", "Failed payments are auto-reversed by your bank, usually within 5–7 working days. Send us the order ID if it hasn't landed."],
    ],
  },
  {
    category: "SHIPPING",
    items: [
      ["WHAT DOES SHIPPING COST?", "Free above ₹999. Below that it's ₹99 standard. Express is ₹199 where available."],
      ["HOW LONG DOES DELIVERY TAKE?", "Standard is 3–5 working days. Express is 1–2 working days."],
      ["DO YOU SHIP OUTSIDE INDIA?", "Not yet. Drop 001 ships within India only."],
    ],
  },
  {
    category: "RETURNS & EXCHANGES",
    items: [
      ["WHAT'S YOUR RETURN WINDOW?", "14 days from delivery, on unworn items with tags still attached."],
      ["ARE SIZE EXCHANGES FREE?", "Yes — size exchanges are free, subject to stock in the size you want."],
      ["HOW LONG DO REFUNDS TAKE?", "Once the return reaches us and passes inspection, refunds are issued to the original payment method."],
    ],
  },
  {
    category: "PRODUCTS & SIZING",
    items: [
      ["WHAT IS 240 GSM?", "Grams per square metre — the fabric's weight. At 240 GSM a tee holds its shape and structure instead of clinging."],
      ["DO YOUR PIECES RUN BIG?", "The oversized cuts are boxy with a drop shoulder by design. If you're between sizes and want a closer fit, size down."],
      ["HOW DO I FIND MY SIZE?", "Use the Size Guide — it has the measurement chart and a fit finder."],
    ],
  },
  {
    category: "ACCOUNT",
    items: [
      ["DO I NEED AN ACCOUNT TO ORDER?", "No, you can check out as a guest. An account just keeps your orders, addresses and wishlist in one place."],
      ["HOW DO I RESET MY PASSWORD?", "Use the 'Forgot?' link on the login page and we'll send a one-time code."],
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <header style={{ marginBottom: "28px" }}>
        <p className="eyebrow mut">SUPPORT</p>
        <h1 className="h1" style={{ marginTop: "10px" }}>FAQ</h1>
      </header>

      <FaqAccordion groups={GROUPS} />
    </>
  );
}
