"use client"

// Tells a visitor that what they are looking at is the demo.
//
// Without it the tour is quietly dishonest: the figures look like somebody's
// finances, and a visitor who edits something would reasonably expect it to
// keep. It also carries the only thing worth asking of them at that moment,
// which is to start an account of their own.
//
// Shown only to the demo account, so nobody signed into their own ledger ever
// sees it.

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { DEMO_USER_ID } from "@/lib/demo"
import { useProfile } from "@/lib/use-profile"

export function DemoBanner() {
  const { profile } = useProfile()
  if (profile.id !== DEMO_USER_ID) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/50 px-4 py-2.5 md:px-6">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          You&apos;re exploring a demo.
        </span>{" "}
        Sample entries across three years — edit anything you like, it resets
        overnight.
      </p>
      <Button size="sm" render={<Link href="/signup" />} nativeButton={false}>
        Create your own
      </Button>
    </div>
  )
}
