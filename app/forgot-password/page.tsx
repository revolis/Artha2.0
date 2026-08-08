import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Send a one-time code and choose a new password.",
}

export default function Page() {
  return <ForgotPasswordForm />
}
