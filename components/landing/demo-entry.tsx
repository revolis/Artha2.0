"use client"

// The doorway into the live demo.
//
// Signing in takes a moment and a blank screen in that moment reads as a
// broken link, so this says what is happening while it happens. On success it
// leaves for the dashboard with a hard navigation rather than a client-side
// push: the session cookie has just been set, and the middleware has to see it
// on the next request or it will send the visitor back to sign in.

import * as React from "react"
import Link from "next/link"

import { ArthaMark } from "@/components/layout/artha-mark"
import { Button } from "@/components/ui/button"
import { enterDemo } from "@/lib/demo"

export function DemoEntry() {
  const [error, setError] = React.useState<string | null>(null)
  const started = React.useRef(false)

  React.useEffect(() => {
    // Effects run twice in development; signing in twice is harmless but the
    // second failure would overwrite a good first result.
    if (started.current) return
    started.current = true

    void enterDemo()
      .then(() => {
        window.location.replace("/dashboard")
      })
      .catch(() => {
        setError(
          "The demo could not be opened just now. It may be being reset — try again in a moment."
        )
      })
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <ArthaMark className="size-12 text-foreground" />

      {error ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Demo unavailable
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button
              variant="outline"
              render={<Link href="/" />}
              nativeButton={false}
            >
              Back to home
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Opening the demo
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Loading three years of sample entries. This takes a second.
          </p>
        </div>
      )}
    </main>
  )
}
