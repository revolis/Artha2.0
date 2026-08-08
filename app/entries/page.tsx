import type { Metadata } from "next"

import { EntriesPage } from "@/components/entries/entries-page"

export const metadata: Metadata = {
  title: "Entries",
}

export default function Page() {
  // No Suspense boundary here on purpose. The ?q= read is confined to a leaf
  // inside EntriesPage that renders nothing, so the page hydrates normally.
  return <EntriesPage />
}
