// The seam between the auth screens and a real backend.
//
// Nothing here talks to a server. The project is still in its design phase —
// no database, no auth provider, no mail service — so these stand in for the
// calls that will replace them, and every screen is built against this file
// rather than against fetch(). When Supabase lands, the bodies change and the
// screens do not.
//
//   sendOtp        → supabase.auth.signInWithOtp({ email })
//   verifyOtp      → supabase.auth.verifyOtp({ email, token, type })
//   setPassword    → supabase.auth.updateUser({ password })
//   signInWithPassword / signInWithGoogle → the matching supabase.auth calls
//
// Until then the code below is the code any six digits are checked against, so
// the flow can be walked end to end without an inbox.

export const DEMO_OTP = "246810"

/** How long before "Resend code" becomes available again. */
export const RESEND_SECONDS = 30

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Stands in for mailing a one-time code. */
export async function sendOtp(email: string): Promise<void> {
  await pause(600)
  if (!isEmail(email))
    throw new Error("That doesn't look like an email address.")
}

/** Stands in for checking the code against the one that was mailed. */
export async function verifyOtp(code: string): Promise<boolean> {
  await pause(500)
  return code === DEMO_OTP
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
