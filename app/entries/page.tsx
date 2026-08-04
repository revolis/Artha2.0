import type { Metadata } from "next"

import { EntriesPage } from "@/components/entries/entries-page"

export const metadata: Metadata = {
  title: "Entries — Artha",
}

export default function Page() {
  return <EntriesPage />
}
