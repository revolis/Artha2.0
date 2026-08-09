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

import * as React from "react"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-flow"
import { DEMO_USER_ID } from "@/lib/demo"
import { useProfile } from "@/lib/use-profile"

export function DemoBanner() {
  const { profile } = useProfile()
  const [leaving, setLeaving] = React.useState(false)

  /**
   * Leaves the demo, then goes to sign up.
   *
   * This used to be a plain link to /signup, which did nothing visible: the
   * middleware sends anyone already signed in away from the sign-up screen,
   * and a demo visitor is signed in — as the demo. So the click made a round
   * trip back to the dashboard and looked like a dead button. Signing out
   * first is what the button was always claiming to do.
   */
  async function leaveDemo() {
    setLeaving(true)
    try {
      await signOut()
    } finally {
      // A full navigation so the middleware sees the cleared cookie.
      window.location.href = "/signup"
    }
  }

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
      <Button size="sm" disabled={leaving} onClick={leaveDemo}>
        {leaving ? "Leaving demo…" : "Create your own"}
      </Button>
    </div>
  )
}
