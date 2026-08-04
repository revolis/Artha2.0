import type { Metadata } from "next"

import { HeatmapPage } from "@/components/heatmap/heatmap-page"

export const metadata: Metadata = {
  title: "Year Heatmap — Artha",
}

export default function Page() {
  return <HeatmapPage />
}
