"use client"

// The auth calls the screens are built against.
//
// These used to be stubs standing in for a backend. They now talk to Supabase,
// and the screens above them did not have to change: the seam was designed for
// exactly this swap.

import { createClient } from "@/lib/supabase/client"

/** How long before "Resend code" becomes available again. */
export const RESEND_SECONDS = 30

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function friendly(message: string): string {
  // Supabase speaks in API terms; these are the ones a person actually meets.
  if (/rate limit|too many/i.test(message)) {
    return "Too many attempts. Wait a minute and try again."
  }
  if (/invalid login credentials/i.test(message)) {
    return "That email and password do not match an account."
  }
  if (/expired|invalid/i.test(message)) {
    return "That code has expired. Send a new one."
  }
  return message
}

/**
 * Why a code is being sent. This decides which of Supabase's email templates
 * is used, and the templates are the only place the wording lives — so the
 * two purposes must take different routes through the API or the reader gets
 * the same email whether they are opening an account or recovering one.
 *
 *   signup   → signInWithOtp        → "Confirm signup" template
 *   recovery → resetPasswordForEmail → "Reset password" template
 */
export type OtpPurpose = "signup" | "recovery"

/** Mails a six-digit code for the given purpose. */
export async function sendOtp(
  email: string,
  { purpose = "signup" }: { purpose?: OtpPurpose } = {}
): Promise<void> {
  if (!isEmail(email)) {
    throw new Error("That doesn't look like an email address.")
  }
  const supabase = createClient()
  const address = email.trim()

  const { error } =
    purpose === "recovery"
      ? await supabase.auth.resetPasswordForEmail(address)
      : await supabase.auth.signInWithOtp({
          email: address,
          // A reset never reaches here, so this can stay true: someone
          // entering a new address at the sign-up step means to sign up.
          options: { shouldCreateUser: true },
        })

  if (error) throw new Error(friendly(error.message))
}

/**
 * Checks the code and, on success, signs the user in — a verified code is
 * proof of ownership, which is what a session represents. The type has to
 * match the way the code was sent.
 */
export async function verifyOtp(
  code: string,
  email: string,
  { purpose = "signup" }: { purpose?: OtpPurpose } = {}
): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code,
    type: purpose === "recovery" ? "recovery" : "email",
  })
  if (error) {
    // A wrong code is an expected outcome, not a failure worth throwing over —
    // the input animates its own rejection.
    if (/invalid|expired|token/i.test(error.message)) return false
    throw new Error(friendly(error.message))
  }
  return true
}

/** Sets the password on the session that verifying the code just created. */
export async function setPassword(password: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(friendly(error.message))
  // The account now has a password, whatever it was created with.
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    await supabase
      .from("settings")
      .update({ has_password: true })
      .eq("user_id", data.user.id)
  }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw new Error(friendly(error.message))
}

export async function signInWithGoogle(next?: string): Promise<void> {
  const supabase = createClient()
  const callback = new URL("/auth/callback", window.location.origin)
  if (next) callback.searchParams.set("next", next)

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  })
  if (error) throw new Error(friendly(error.message))
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export interface PasswordRule {
  id: string
  label: string
  test: (value: string) => boolean
}

// Deliberately explicit rather than a single regex: the screen lists these
// back to the user, and a list you can render is worth more than a clever
// pattern nobody can explain.
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "At least 10 characters",
    test: (v) => v.length >= 10,
  },
  {
    id: "case",
    label: "Upper and lower case",
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  { id: "digit", label: "A number", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "A symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
]

export function passwordScore(value: string): number {
  return PASSWORD_RULES.filter((rule) => rule.test(value)).length
}

export function isStrongPassword(value: string): boolean {
  return passwordScore(value) === PASSWORD_RULES.length
}

export const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"]
