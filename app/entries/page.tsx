import { Suspense } from "react"
import type { Metadata } from "next"

import { EntriesPage } from "@/components/entries/entries-page"

export const metadata: Metadata = {
  title: "Entries",
}

export default function Page() {
  // EntriesPage reads ?q= from the header search, which needs a Suspense
  // boundary so the rest of the route can still be prerendered.
  return (
    <Suspense>
      <EntriesPage />
    </Suspense>
  )
}
