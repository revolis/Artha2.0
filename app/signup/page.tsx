import type { Metadata } from "next"

import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start tracking crypto, equities and cash income in one ledger.",
}

export default function Page() {
  return <SignupForm />
}
