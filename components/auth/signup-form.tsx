"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { EmailStep } from "@/components/auth/email-step"
import { GoogleButton } from "@/components/auth/google-button"
import { OtpStep } from "@/components/auth/otp-step"
import { SetPasswordStep } from "@/components/auth/set-password-step"
import { FieldSeparator } from "@/components/ui/field"

type Step = "email" | "otp" | "password"

const COPY: Record<Step, { title: string; description: string }> = {
  email: {
    title: "Create your account",
    description: "Start with the address you want the ledger tied to.",
  },
  otp: {
    title: "Confirm your email",
    description: "Enter the six-digit code we sent you.",
  },
  password: {
    title: "Set a password",
    description: "One that would take a while to guess.",
  },
}

export function SignupForm() {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>("email")
  const [email, setEmail] = React.useState("")

  const copy = COPY[step]

  return (
    <AuthShell
      title={copy.title}
      description={step === "otp" ? `Sent to ${email}.` : copy.description}
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      {step === "email" ? (
        <>
          <GoogleButton label="Continue with Google" />
          <FieldSeparator>or</FieldSeparator>
          <EmailStep
            email={email}
            onEmailChange={setEmail}
            onSent={() => setStep("otp")}
            submitLabel="Send confirmation code"
          />
        </>
      ) : null}

      {step === "otp" ? (
        <OtpStep
          email={email}
          onVerified={() => setStep("password")}
          onBack={() => setStep("email")}
        />
      ) : null}

      {step === "password" ? (
        <SetPasswordStep
          submitLabel="Create account"
          onDone={() => {
            router.push("/dashboard")
            router.refresh()
          }}
        />
      ) : null}
    </AuthShell>
  )
}
