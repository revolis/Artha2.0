"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { EmailStep } from "@/components/auth/email-step"
import { OtpStep } from "@/components/auth/otp-step"
import { SetPasswordStep } from "@/components/auth/set-password-step"

type Step = "email" | "otp" | "password"

const COPY: Record<Step, { title: string; description: string }> = {
  email: {
    title: "Reset your password",
    description: "Tell us the address on the account and we'll send a code.",
  },
  otp: {
    title: "Confirm it's you",
    description: "Enter the six-digit code we sent you.",
  },
  password: {
    title: "Choose a new password",
    description: "Make this one harder than the last.",
  },
}

export function ForgotPasswordForm() {
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
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to log in
          </Link>
        </>
      }
    >
      {step === "email" ? (
        <EmailStep
          email={email}
          onEmailChange={setEmail}
          onSent={() => setStep("otp")}
          submitLabel="Send reset code"
        />
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
          submitLabel="Save and log in"
          onDone={() => router.push("/login")}
        />
      ) : null}
    </AuthShell>
  )
}
