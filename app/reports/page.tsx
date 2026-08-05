import { Suspense } from "react"
import type { Metadata } from "next"

import { ReportsPage } from "@/components/reports/reports-page"

export const metadata: Metadata = {
  title: "Reports",
}

export default function Page() {
  // ReportsPage reads search params for deep links, which Next requires be
  // wrapped in a Suspense boundary.
  return (
    <Suspense>
      <ReportsPage />
    </Suspense>
  )
}
