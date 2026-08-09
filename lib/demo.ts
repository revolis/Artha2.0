"use client"

// The account behind the Live demo button.
//
// The button used to point at /dashboard, which the middleware turned into a
// trip to the sign-in page — the opposite of a demo. It signs the visitor into
// a shared account instead, so the first thing they see is a dashboard with
// three years of entries, charts drawn from real rows, and every page working
// exactly as it will for them.
//
// These credentials are meant to be public. The account exists to be signed
// into by strangers: it holds sample data, sends no email, and is put back to a
// known state every night. It cannot be deleted — the delete-account function
// refuses this one id specifically, since otherwise a single visitor could
// take the demo down for good.

import { createClient } from "@/lib/supabase/client"

export const DEMO_EMAIL = "demo@0xr8n.me"
export const DEMO_PASSWORD = "ArthaLiveDemo2026"

/** The demo account's id, so the app can tell when it is being toured. */
export const DEMO_USER_ID = "d3300000-0000-4000-8000-000000000001"

/** Signs in as the demo account. Throws so the caller can say what went wrong. */
export async function enterDemo(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  if (error) throw new Error(error.message)
}
