"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { useSession } from "@/components/session-provider";
import { showToast } from "@/lib/ui-events";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useSession();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const user = register({
      name: String(form.get("name") || "").toUpperCase(),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      dob: String(form.get("dob") || ""),
    });
    showToast(`ACCOUNT CREATED — ${user.name}`);
    router.push("/account");
  }

  return (
    <AuthCard
      eyebrow="ACCOUNT"
      title="JOIN THE UNEMPLOYED."
      footer={
        <p className="small mut">
          Already have an account? <Link href="/login" className="tlink">LOG IN</Link>
        </p>
      }
    >
      <form onSubmit={submit}>
        <div className="fgrp">
          <label className="fl" htmlFor="rg-name">FULL NAME</label>
          <input className="inp" id="rg-name" name="name" required placeholder="Faisal K." />
        </div>

        <div className="fgrp">
          <label className="fl" htmlFor="rg-email">EMAIL</label>
          <input className="inp" id="rg-email" name="email" type="email" required placeholder="you@example.com" />
        </div>

        <div className="frow">
          <div className="fgrp">
            <label className="fl" htmlFor="rg-phone">PHONE</label>
            <input className="inp" id="rg-phone" name="phone" type="tel" placeholder="+91 " />
          </div>
          <div className="fgrp">
            <label className="fl" htmlFor="rg-dob">DATE OF BIRTH</label>
            <input className="inp" id="rg-dob" name="dob" type="date" />
          </div>
        </div>

        <div className="fgrp">
          <label className="fl" htmlFor="rg-pass">PASSWORD</label>
          <input className="inp" id="rg-pass" type="password" required minLength={8} placeholder="At least 8 characters" />
        </div>

        <label className="ck"><input type="checkbox" defaultChecked /> DROP ALERTS &amp; NEWSLETTER</label>
        <label className="ck">
          <input type="checkbox" required /> I AGREE TO THE{" "}
          <Link href="/legal/terms" className="tlink" style={{ border: 0 }}>TERMS</Link> AND{" "}
          <Link href="/legal/privacy" className="tlink" style={{ border: 0 }}>PRIVACY POLICY</Link>
        </label>

        <button className="btn btn-full" type="submit" style={{ marginTop: "22px" }}>CREATE ACCOUNT</button>
      </form>
    </AuthCard>
  );
}
