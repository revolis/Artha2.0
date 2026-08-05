"use client"

import * as React from "react"
import { ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const RESEND_SECONDS = 30

/**
 * Design-phase verification step. A real deployment sends the code from the
 * server and checks it there; here the code is generated locally and shown on
 * screen so the flow can be walked through end to end.
 */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

interface OtpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  email: string
  /** The code the dialog will accept. */
  code: string
  confirmLabel: string
  destructive?: boolean
  onVerified: () => void
  onResend: () => void
}

export function OtpDialog({
  open,
  onOpenChange,
  title,
  description,
  email,
  code,
  confirmLabel,
  destructive = false,
  onVerified,
  onResend,
}: OtpDialogProps) {
  const [entered, setEntered] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS)

  // Countdown for the resend link. Timer-based so it keeps running even when
  // the page is not painting.
  React.useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [open])

  function verify() {
    if (entered.trim() === code) {
      setEntered("")
      setError(null)
      onVerified()
      onOpenChange(false)
      return
    }
    setError("That code doesn't match. Check the email and try again.")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setEntered("")
          setError(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm">
            We sent a 6-digit code to{" "}
            <span className="font-medium">{email}</span>.
          </p>

          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="otp">Verification code</FieldLabel>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              aria-invalid={error ? true : undefined}
              className="text-center text-lg tracking-[0.4em] tabular-nums"
              value={entered}
              onChange={(event) => {
                setEntered(event.target.value.replace(/\D/g, ""))
                setError(null)
              }}
            />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </Field>

          {/* Stand-in for the email that a backend would send. */}
          <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
            Design preview — no email is actually sent. Your code is{" "}
            <span className="font-mono font-medium text-foreground">
              {code}
            </span>
            .
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {secondsLeft > 0 ? (
              <span>Resend available in {secondsLeft}s</span>
            ) : (
              <Button
                variant="link"
                size="sm"
                className="h-auto px-0"
                onClick={() => {
                  onResend()
                  setSecondsLeft(RESEND_SECONDS)
                  setError(null)
                }}
              >
                Resend code
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={entered.length !== 6}
            onClick={verify}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
