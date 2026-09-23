import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("ip");

export default function Page() {
  return <LegalPage slug="ip" />;
}
