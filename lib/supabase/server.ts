import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "@/lib/supabase/database.types"

/**
 * The server client, for server components, route handlers and server actions.
 *
 * A fresh instance per request — the cookie store belongs to the request, so a
 * shared client would hand one visitor another's session.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a server component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  )
}
