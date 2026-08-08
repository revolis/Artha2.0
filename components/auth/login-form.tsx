"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { GoogleButton } from "@/components/auth/google-button"
import { PasswordField } from "@/components/auth/password-field"
import { Loader2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { isEmail } from "@/lib/auth-flow"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [signingIn, setSigningIn] = React.useState(false)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!isEmail(email)) {
      setError("Enter a valid email address.")
      return
    }
    if (password.length === 0) {
      setError("Enter your password.")
      return
    }
    setError(null)
    setSigningIn(true)
    router.push("/dashboard")
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Pick up where your ledger left off."
      footer={
        <>
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton label="Continue with Google" />
      <FieldSeparator>or</FieldSeparator>

      <form onSubmit={submit}>
        <FieldGroup>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="login-email">Email address</FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setEmail(event.target.value)
                setError(null)
              }}
            />
          </Field>

          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={(value) => {
              setPassword(value)
              setError(null)
            }}
            autoComplete="current-password"
          />

          {error ? <FieldError>{error}</FieldError> : null}

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={signingIn}
          >
            {signingIn ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Signing in…
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
