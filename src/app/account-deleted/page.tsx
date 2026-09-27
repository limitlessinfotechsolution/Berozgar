import Link from "next/link";

export const metadata = {
  title: "DELETION REQUESTED — BEROZGAR",
  robots: { index: false },
};

/*
 * Where the shopper lands after asking for their account to be deleted. They've been
 * signed out everywhere, so this page is public (outside /account, which src/proxy.ts
 * gates); the ticket number arrives in the query string.
 */
export default async function AccountDeletedPage({ searchParams }: PageProps<"/account-deleted">) {
  const ticket = (await searchParams).ticket;
  const ticketNumber = typeof ticket === "string" && /^SUP-\d{4}-\d{5,}$/.test(ticket) ? ticket : null;

  return (
    <div className="page-fade">
      <div className="wrap" style={{ paddingTop: "56px", paddingBottom: "96px", maxWidth: "640px" }}>
        <h1 className="h2">WE&apos;VE GOT YOUR REQUEST</h1>
        <p style={{ marginTop: "18px" }}>
          We&apos;ll delete your account within 30 days
          {ticketNumber ? (
            <>
              {" "}— your reference is <b className="num">{ticketNumber}</b>
            </>
          ) : null}
          . You&apos;ve been signed out on every device, and we&apos;ve stopped marketing messages.
        </p>
        <ul className="small" style={{ margin: "20px 0 0", paddingLeft: "18px", lineHeight: 1.9, listStyle: "disc" }}>
          <li>Your profile, addresses, wishlist and saved bag are removed.</li>
          <li>Orders and invoices stay for 8 years, as tax law requires.</li>
          <li>Changed your mind? Sign in before then and choose Keep my account.</li>
        </ul>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "32px" }}>
          <Link href="/" className="btn">BACK TO THE SHOP</Link>
          <Link href="/legal/privacy" className="btn btn-o">PRIVACY POLICY</Link>
        </div>
      </div>
    </div>
  );
}
