import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("shipping");

export default function Page() {
  return <LegalPage slug="shipping" />;
}
