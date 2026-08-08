"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { GoogleButton } from "@/components/auth/google-button"
import { PasswordField } from "@/components/auth/password-field"
import { Loader2 } from "@/components/icons"
import { QueryParamSync } from "@/components/layout/query-param-sync"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { isEmail, signInWithPassword } from "@/lib/auth-flow"

export function LoginForm() {
  const router = useRouter()
  // Where the middleware wanted them before it sent them here.
  const [next, setNext] = React.useState("/dashboard")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [signingIn, setSigningIn] = React.useState(false)

  async function submit(event: React.FormEvent) {
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
    try {
      await signInWithPassword(email, password)
      // refresh() so the middleware and every server component pick up the new
      // session; push() alone would navigate with the old one still cached.
      router.push(next)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.")
      setSigningIn(false)
    }
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
      {/* Renders nothing; keeps ?next= out of a Suspense boundary that would
          otherwise wrap the whole screen. */}
      <React.Suspense fallback={null}>
        <QueryParamSync
          name="next"
          onChange={(value) => setNext(value.startsWith("/") ? value : "/dashboard")}
        />
      </React.Suspense>

      <GoogleButton label="Continue with Google" next={next} />
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
