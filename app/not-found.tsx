import type { Metadata } from "next"

import { NotFoundSpotlight } from "@/components/motion/not-found/spotlight"

export const metadata: Metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-16">
      <NotFoundSpotlight
        title="Nothing filed here"
        description="This page moved, or it never existed. Your ledger is where you left it."
        homeHref="/"
        homeLabel="Back to home"
        browseHref="/dashboard"
        browseLabel="Open the dashboard"
      />
    </main>
  )
}
