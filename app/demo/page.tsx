import type { Metadata } from "next"

import { DemoEntry } from "@/components/landing/demo-entry"

export const metadata: Metadata = {
  title: "Live demo — ARTHA",
  description:
    "Explore Artha with three years of sample entries, without signing up.",
}

export default function DemoPage() {
  return <DemoEntry />
}
