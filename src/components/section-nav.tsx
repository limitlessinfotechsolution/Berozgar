"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
 * Sidebar nav for the section shells (account, help, legal). `base` is the
 * section root; a tab's slug of "" is the root itself.
 */
export function SectionNav({
  base,
  tabs,
  children,
}: {
  base: string;
  tabs: [string, string][];
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const current = pathname.replace(new RegExp(`^${base}/?`), "").split("/")[0];

  return (
    <aside className="acc-side">
      {tabs.map(([slug, label]) => (
        <Link key={slug} href={`${base}${slug ? `/${slug}` : ""}`} className={current === slug ? "on" : ""}>
          {label}
        </Link>
      ))}
      {children}
    </aside>
  );
}
