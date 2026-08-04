import type { Metadata } from "next"

import { P2PPage } from "@/components/p2p/p2p-page"

export const metadata: Metadata = {
  title: "Fiat/P2P — Artha",
}

export default function Page() {
  return <P2PPage />
}
