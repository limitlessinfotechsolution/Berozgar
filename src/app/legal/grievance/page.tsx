import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("grievance");

export default function Page() {
  return <LegalPage slug="grievance" />;
}
