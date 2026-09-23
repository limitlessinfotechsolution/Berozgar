import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("cancellation");

export default function Page() {
  return <LegalPage slug="cancellation" />;
}
