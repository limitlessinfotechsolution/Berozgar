import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("refund");

export default function Page() {
  return <LegalPage slug="refund" />;
}
