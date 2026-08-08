"use client"

import * as React from "react"

import { Loader2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/lib/auth-flow"

/** Google's four-colour mark, at its official proportions. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

/** The only third-party sign-in offered. */
export function GoogleButton({
  label,
  next,
}: {
  label: string
  /** Where to land once Google sends them back. */
  next?: string
}) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      // Redirects away on success, so `busy` stays true until the page leaves.
      await signInWithGoogle(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.")
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={start}
      >
        {busy ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <GoogleMark data-icon="inline-start" />
        )}
        {label}
      </Button>
      {error ? (
        <p className="text-center text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
