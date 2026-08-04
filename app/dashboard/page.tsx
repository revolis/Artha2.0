import type { Metadata } from "next"

import { DashboardPage } from "@/components/dashboard/dashboard-page"

export const metadata: Metadata = {
  title: "Dashboard — Artha",
}

export default function Page() {
  return <DashboardPage />
}
