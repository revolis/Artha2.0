"use client"

import * as React from "react"

import OtpInput from "@/components/lab/otp-segmented-input"
import { Button } from "@/components/ui/button"
import {
  RESEND_SECONDS,
  sendOtp,
  verifyOtp,
  type OtpPurpose,
} from "@/lib/auth-flow"

/**
 * The code step, shared by sign-up and password reset.
 *
 * The segmented input owns its own success and failure animation — it cascades
 * the cells green on a match and shakes the digits out on a miss — so this only
 * has to hand it a verifier and react once it settles.
 */
export function OtpStep({
  email,
  onVerified,
  onBack,
  purpose = "signup",
}: {
  email: string
  onVerified: () => void
  onBack: () => void
  /** Must match how the code was sent, or the check fails. */
  purpose?: OtpPurpose
}) {
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS)
  const [resending, setResending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft])

  async function verify(value: string) {
    try {
      const ok = await verifyOtp(value, email, { purpose })
      if (ok) {
        // Let the cells finish their cascade before the step changes.
        window.setTimeout(onVerified, 700)
      }
      return ok
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.")
      return false
    }
  }

  async function resend() {
    setResending(true)
    setError(null)
    try {
      await sendOtp(email, { purpose })
      setSecondsLeft(RESEND_SECONDS)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center">
        <OtpInput length={6} group verify={verify} />
      </div>

      {error ? (
        <p className="text-center text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          The code expires after an hour. Check spam if it hasn&apos;t arrived.
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={secondsLeft > 0 || resending}
          onClick={resend}
        >
          {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onBack}>
          Use a different address
        </Button>
      </div>
    </div>
  )
}
