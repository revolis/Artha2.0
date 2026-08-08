"use client"

import * as React from "react"

import OtpInput from "@/components/lab/otp-segmented-input"
import { Button } from "@/components/ui/button"
import { DEMO_OTP, RESEND_SECONDS, sendOtp, verifyOtp } from "@/lib/auth-flow"

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
}: {
  email: string
  onVerified: () => void
  onBack: () => void
}) {
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS)
  const [resending, setResending] = React.useState(false)

  React.useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft])

  async function verify(value: string) {
    const ok = await verifyOtp(value)
    if (ok) {
      // Let the cells finish their cascade before the step changes.
      window.setTimeout(onVerified, 700)
    }
    return ok
  }

  async function resend() {
    setResending(true)
    try {
      await sendOtp(email)
      setSecondsLeft(RESEND_SECONDS)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center">
        <OtpInput length={6} group verify={verify} />
      </div>

      {/* Stated plainly, because there is no inbox behind this yet. */}
      <p className="rounded-lg border border-dashed px-3 py-2 text-center text-xs text-muted-foreground">
        No mail is sent while the backend is being built — use{" "}
        <span className="font-medium text-foreground tabular-nums">
          {DEMO_OTP}
        </span>
      </p>

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
