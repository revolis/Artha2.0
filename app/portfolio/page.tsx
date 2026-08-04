import type { Metadata } from "next"

import { PortfolioPage } from "@/components/portfolio/portfolio-page"

export const metadata: Metadata = {
  title: "Portfolio — Artha",
}

export default function Page() {
  return <PortfolioPage />
}
