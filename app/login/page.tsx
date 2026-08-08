import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Artha ledger.",
}

export default function Page() {
  return <LoginForm />
}
