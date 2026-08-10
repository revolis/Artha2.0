import type { Metadata } from "next"

import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start tracking your everyday income/expenses in one ledger.",
}

export default function Page() {
  return <SignupForm />
}
