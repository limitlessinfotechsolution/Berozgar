"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SectionNav } from "@/components/section-nav";
import { useSession } from "@/components/session-provider";
import { showToast } from "@/lib/ui-events";

const TABS: [string, string][] = [
  ["", "OVERVIEW"],
  ["orders", "ORDERS"],
  ["wishlist", "WISHLIST"],
  ["reviews", "REVIEWS"],
  ["addresses", "ADDRESSES"],
  ["profile", "PROFILE"],
];

export function AccountNav() {
  const router = useRouter();
  const { logout } = useSession();

  return (
    <SectionNav base="/account" tabs={TABS}>
      <Link
        href="/"
        className="lg"
        onClick={async (e) => {
          e.preventDefault();
          await logout();
          showToast("LOGGED OUT");
          router.push("/");
        }}
      >
        LOGOUT
      </Link>
    </SectionNav>
  );
}
