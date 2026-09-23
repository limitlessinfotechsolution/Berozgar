import { Suspense } from "react";
import { LoginClient } from "@/components/login-client";

export const metadata = {
  title: "LOGIN — BEROZGAR",
  description: "Sign in to your Berozgar account.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
