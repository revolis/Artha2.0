import type { Metadata } from "next"

import { HelpPage } from "@/components/help/help-page"

export const metadata: Metadata = {
  title: "Help Centre",
}

export default function Page() {
  return <HelpPage />
}
