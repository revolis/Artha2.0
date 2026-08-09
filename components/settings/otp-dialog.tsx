"use client"

import * as React from "react"
import { ShieldCheck } from "@/components/icons"

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

interface OtpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Where the code was sent, shown so the reader knows which inbox to open. */
  email: string
  confirmLabel: string
  destructive?: boolean
  /**
   * Checks the code and does the thing. Rejects with a message to show if the
   * code is wrong or the change is refused.
   *
   * The dialog deliberately cannot tell whether a code is valid on its own —
   * it used to hold the answer and compare against it, which made the whole
   * step decorative. Verification belongs to whoever issued the code.
   */
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
}

export function OtpDialog({
  open,
  onOpenChange,
  title,
  description,
  email,
  confirmLabel,
  destructive = false,
  onVerify,
  onResend,
}: OtpDialogProps) {
  const [entered, setEntered] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
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

  async function verify() {
    setPending(true)
    setError(null)
    try {
      await onVerify(entered)
      setEntered("")
      onOpenChange(false)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "That code doesn't match. Check the email and try again."
      )
    } finally {
      setPending(false)
    }
  }

  async function resend() {
    setError(null)
    setSecondsLeft(RESEND_SECONDS)
    try {
      await onResend()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resend.")
    }
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
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </Field>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {secondsLeft > 0 ? (
              <span>Resend available in {secondsLeft}s</span>
            ) : (
              <Button
                variant="link"
                size="sm"
                className="h-auto px-0"
                onClick={resend}
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
            disabled={entered.length !== 6 || pending}
            onClick={verify}
          >
            {pending ? "Checking…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
