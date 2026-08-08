"use client"

import * as React from "react"

import { Loader2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { isEmail, sendOtp } from "@/lib/auth-flow"

/** Collects the address and asks for a code to be sent to it. */
export function EmailStep({
  email,
  onEmailChange,
  onSent,
  submitLabel,
  createUser = true,
}: {
  email: string
  onEmailChange: (value: string) => void
  onSent: () => void
  submitLabel: string
  /** False on a password reset, so a typo cannot open a new account. */
  createUser?: boolean
}) {
  const [error, setError] = React.useState<string | null>(null)
  const [sending, setSending] = React.useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!isEmail(email)) {
      setError("Enter a valid email address.")
      return
    }
    setError(null)
    setSending(true)
    try {
      await sendOtp(email, { createUser })
      onSent()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup>
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              onEmailChange(event.target.value)
              setError(null)
            }}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={sending}>
          {sending ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Sending code…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}
