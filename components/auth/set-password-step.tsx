"use client"

import * as React from "react"

import { PasswordField } from "@/components/auth/password-field"
import { Loader2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup } from "@/components/ui/field"
import { isStrongPassword, setPassword } from "@/lib/auth-flow"

/** The final step of both sign-up and reset: choose a password that holds up. */
export function SetPasswordStep({
  submitLabel,
  onDone,
}: {
  submitLabel: string
  onDone: () => void
}) {
  const [password, setPasswordValue] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  const strong = isStrongPassword(password)
  const matches = password.length > 0 && password === confirm

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!strong) {
      setError("Meet every requirement below before continuing.")
      return
    }
    if (!matches) {
      setError("The two passwords don't match.")
      return
    }
    setError(null)
    setSaving(true)
    try {
      await setPassword(password)
      onDone()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup>
        <PasswordField
          id="password"
          label="New password"
          value={password}
          onChange={(value) => {
            setPasswordValue(value)
            setError(null)
          }}
          showRules
        />
        <PasswordField
          id="confirm"
          label="Confirm password"
          value={confirm}
          onChange={(value) => {
            setConfirm(value)
            setError(null)
          }}
        />

        {error ? <FieldError>{error}</FieldError> : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={saving || !strong || !matches}
        >
          {saving ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}
