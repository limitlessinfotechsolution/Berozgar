import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("cookies");

export default function Page() {
  return <LegalPage slug="cookies" />;
}
