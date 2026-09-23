"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SOCIALS: [string, string][] = [
  ["INSTAGRAM", "https://instagram.com/"],
  ["YOUTUBE", "https://youtube.com/"],
  ["TIKTOK", "https://tiktok.com/"],
];

export function SiteFooter() {
  const pathname = usePathname();
  
  return (
    <>
      <footer className="brz-footer mt-auto">
        <div className="wrap">
          <div className="f-grid">
            <div>
              <Link href="/" className="logo" style={{ fontSize: "17px" }}>BEROZGAR</Link>
              <p className="small mut" style={{ marginTop: "14px", maxWidth: "240px" }}>
                Unemployed For A Reason.<br />Premium Indian streetwear. Drop culture, no noise.
              </p>
            </div>
            <div>
              <h5>SHOP</h5>
              <Link href="/shop">All Products</Link>
              <Link href="/shop?sort=newest">New Arrivals</Link>
              <Link href="/shop?sort=best">Best Sellers</Link>
              <Link href="/collections">Collections</Link>
              <Link href="/shop?cat=sale">Sale</Link>
            </div>
            <div>
              <h5>BEROZGAR</h5>
              <Link href="/about">About</Link>
              <Link href="/manifesto">Manifesto</Link>
              <Link href="/lookbook">Lookbook</Link>
              <Link href="/journal">Journal</Link>
              <Link href="/collaborations">Collaborations</Link>
            </div>
            <div>
              <h5>HELP</h5>
              <Link href="/help/contact">Contact</Link>
              <Link href="/help/faq">FAQ</Link>
              <Link href="/help/shipping">Shipping</Link>
              <Link href="/help/returns">Returns</Link>
              <Link href="/track-order">Track Order</Link>
            </div>
            <div>
              <h5>LEGAL</h5>
              <Link href="/legal/terms">Terms</Link>
              <Link href="/legal/privacy">Privacy</Link>
              <Link href="/legal/refund">Return &amp; Refund</Link>
              <Link href="/legal/cancellation">Cancellation</Link>
              <Link href="/legal/shipping">Shipping</Link>
              <Link href="/legal/ip">Your Artwork</Link>
              <Link href="/legal/bulk">Bulk Orders</Link>
              <Link href="/legal/cookies">Cookies</Link>
              <Link href="/legal/disclaimer">Disclaimer</Link>
              <Link href="/legal/grievance">Grievances</Link>
            </div>
          </div>
          <div className="f-bottom">
            <small>© {new Date().getFullYear()} BEROZGAR — UNEMPLOYED FOR A REASON.</small>
            {/* TODO: replace with the real profile URLs. External, so plain
                anchors with rel/target rather than next/link. */}
            <div className="f-soc">
              {SOCIALS.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAV BAR */}
      <nav id="bnav" aria-label="Mobile">
        <ul>
          <li>
            <Link href="/" className={pathname === "/" ? "on" : ""}>
              <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10h-6v-7h-6v7H3z"></path></svg>
              HOME
            </Link>
          </li>
          <li>
            <Link href="/shop" className={pathname.startsWith("/shop") ? "on" : ""}>
              <svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path></svg>
              SHOP
            </Link>
          </li>
          <li>
            <button data-action="open-search" onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}>
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.5-4.5"></path></svg>
              SEARCH
            </button>
          </li>
          <li>
            <Link href="/account/wishlist" className={pathname === "/account/wishlist" ? "on" : ""}>
              <svg viewBox="0 0 24 24"><path d="M12 21C7 16.5 3 13.2 3 9.1 3 6.3 5.2 4 8 4c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.3 5 5.1 0 4.1-4 7.4-9 11.9z"></path></svg>
              WISHLIST
            </Link>
          </li>
          <li>
            <Link href="/account" className={pathname === "/account" ? "on" : ""}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"></path></svg>
              ACCOUNT
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
