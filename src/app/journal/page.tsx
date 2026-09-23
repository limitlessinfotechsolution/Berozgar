import { articles } from "@/lib/data";
import { JournalClient } from "@/components/journal-client";

export const metadata = {
  title: "JOURNAL — BEROZGAR",
  description: "Berozgar magazine and brand stories.",
};

export default function JournalPage() {
  return <JournalClient articles={articles} />;
}
