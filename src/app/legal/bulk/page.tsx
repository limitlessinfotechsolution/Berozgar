import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("bulk");

export default function Page() {
  return <LegalPage slug="bulk" />;
}
