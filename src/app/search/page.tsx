import { Suspense } from "react";
import { SearchClient } from "@/components/search-client";

export const metadata = {
  title: "SEARCH — BEROZGAR",
  description: "Search Drop 001.",
};

export default function SearchPage() {
  return (
    <Suspense>
      <SearchClient />
    </Suspense>
  );
}
