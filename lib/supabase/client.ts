"use client"

// The browser client. One instance per tab, reused — creating a second one
// gives you a second auth listener and two copies of the session.

import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/lib/supabase/database.types"

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (client) return client
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  return client
}

/**
 * Resolves once the client has finished restoring the session from cookies.
 *
 * Every table is behind row-level security, so a read issued before the
 * session is hydrated goes out unauthenticated and comes back with **zero
 * rows** — not an error. A store cannot tell that apart from an empty account:
 * it records a successful, empty load and never asks again, and the page sits
 * at nothing until it is reloaded by hand. Arriving through /demo made this
 * easy to hit, because the sign-in and the first render are moments apart.
 *
 * getUser() forces that restore to complete. Memoised for the life of the
 * page: it only guards the first read of each store, and a sign-in navigates.
 * A signed-out visitor resolves just as quickly with no user, which is the
 * right answer for them.
 */
let sessionSettled: Promise<void> | null = null

export function sessionReady(): Promise<void> {
  if (!sessionSettled) {
    sessionSettled = createClient()
      .auth.getUser()
      .then(() => undefined)
      .catch(() => undefined)
  }
  return sessionSettled
}
