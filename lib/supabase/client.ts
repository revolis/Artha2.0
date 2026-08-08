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
