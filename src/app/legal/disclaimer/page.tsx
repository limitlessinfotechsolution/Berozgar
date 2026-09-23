import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("disclaimer");

export default function Page() {
  return <LegalPage slug="disclaimer" />;
}
