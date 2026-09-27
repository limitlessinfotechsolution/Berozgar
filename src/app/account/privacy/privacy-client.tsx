"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormError } from "@/components/form-error";
import { accountApi } from "@/lib/account-client";
import { formatDay } from "@/lib/dates";
import { showToast } from "@/lib/ui-events";

type Acceptance = { slug: string; version: string; context: string; acceptedAt: string; orderNumber: string | null };
type Policy = { slug: string; title: string; version: string };

/*
 * Which policy versions the shopper accepted (ERP /account/consents), newest first,
 * and — when a policy has changed since — a line saying so with a link to read it.
 */
function PoliciesSection() {
  const [rows, setRows] = useState<Acceptance[] | null>(null);
  const [current, setCurrent] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      accountApi<{ data: Acceptance[] }>("/api/account/consents"),
      fetch("/api/legal", { cache: "no-store" })
        .then((r) => r.json() as Promise<{ data?: Policy[] }>)
        .catch(() => ({ data: [] as Policy[] })),
    ]).then(([consents, legal]) => {
      if (cancelled) return;
      if (!consents.ok) return setError(consents.error);
      // Newest first (the ERP sends them so; sorting here keeps "changed since" right regardless).
      setRows([...consents.data.data].sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt)));
      setCurrent(legal.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const title = (slug: string) => current.find((p) => p.slug === slug)?.title ?? slug.replace(/-/g, " ");
  /* Rows are newest first, so the first per policy is the version last accepted. */
  const updated = current.filter((policy) => {
    const last = rows?.find((r) => r.slug === policy.slug);
    return last && last.version !== policy.version;
  });

  return (
    <section className="acc-sec first" aria-labelledby="pv-policies-h">
      <h2 className="cap" id="pv-policies-h">Policies you accepted</h2>
      <p className="small mut">A record of each version you agreed to, when you signed up or placed an order.</p>
      <FormError message={error} />
      {!rows && !error && (
        <div aria-hidden="true" style={{ display: "grid", gap: "10px" }}>
          <div className="skel-line" />
          <div className="skel-line short" />
        </div>
      )}
      {updated.length > 0 && (
        <ul className="nudges" style={{ marginTop: 0, marginBottom: "18px" }}>
          {updated.map((policy) => (
            <li key={policy.slug}>
              <span className="small">
                The {policy.title} has changed since you accepted it (now version {policy.version}).
              </span>
              <Link href={`/legal/${policy.slug}`} className="tlink">Read it</Link>
            </li>
          ))}
        </ul>
      )}
      {rows?.length === 0 && <p className="small mut">Nothing recorded yet.</p>}
      {rows && rows.length > 0 && (
        <ul className="dev-list">
          {rows.map((r, i) => (
            <li key={`${r.slug}-${r.version}-${r.acceptedAt}-${i}`} className="dev-row">
              <div>
                <p className="small">
                  <b>{title(r.slug)}</b> <span className="mut">version {r.version}</span>
                </p>
                <p className="small mut">
                  {formatDay(r.acceptedAt)} · {r.orderNumber ? `With order #${r.orderNumber}` : "On your account"}
                </p>
              </div>
              <Link href={`/legal/${r.slug}`} className="tlink">Read</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* The ERP's /account/export, saved as a file. The proxy returns it as JSON, so the
   page names the file itself, the way the ERP's content-disposition does. */
function DownloadSection() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    const result = await accountApi<{ exportedAt?: string }>("/api/account/export");
    setBusy(false);
    if (!result.ok) return setError(result.error);
    const day = (result.data.exportedAt ?? new Date().toISOString()).slice(0, 10);
    const url = URL.createObjectURL(new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `berozgar-data-${day}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("YOUR DATA IS DOWNLOADING");
  }

  return (
    <section className="acc-sec" aria-labelledby="pv-download-h">
      <h2 className="cap" id="pv-download-h">Download your data</h2>
      <p className="small mut">
        A file with your profile, addresses, orders, returns, reviews, wishlist and the choices above. It opens in any
        text editor.
      </p>
      <FormError message={error} />
      <button type="button" className="btn btn-o" disabled={busy} onClick={() => void download()}>
        {busy ? "PREPARING…" : "DOWNLOAD MY DATA"}
      </button>
    </section>
  );
}

export function Privacy() {
  return (
    <>
      <h1 className="h2">PRIVACY &amp; DATA</h1>
      <p className="small mut acc-sub">
        How we use your information is set out in our <Link href="/legal/privacy" className="tlink">Privacy Policy</Link>.
      </p>
      <PoliciesSection />
      <DownloadSection />
    </>
  );
}
