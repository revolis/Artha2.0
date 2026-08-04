import type { Metadata } from "next"

import { EntriesPage } from "@/components/entries/entries-page"

export const metadata: Metadata = {
  title: "Entries",
}

export default function Page() {
  return <EntriesPage />
}
