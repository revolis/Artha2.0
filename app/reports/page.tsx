import type { Metadata } from "next"

import { ReportsPage } from "@/components/reports/reports-page"

export const metadata: Metadata = {
  title: "Reports",
}

export default function Page() {
  // No Suspense boundary here on purpose. The ?year= and ?scope= reads are
  // confined to leaves inside ReportsPage that render nothing, so the page
  // hydrates normally.
  return <ReportsPage />
}
