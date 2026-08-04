import type { Metadata } from "next"

import { GoalsPage } from "@/components/goals/goals-page"

export const metadata: Metadata = {
  title: "Goals — Artha",
}

export default function Page() {
  return <GoalsPage />
}
