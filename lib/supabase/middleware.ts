import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "@/lib/supabase/database.types"

/** Routes anyone may see, signed in or not. */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth",
  "/about",
  "/contact",
  "/help",
  // Scheduled jobs arrive with no session, so they have to be let through or
  // the scheduler just collects redirects to the sign-in page. Only /api/cron
  // rather than all of /api, so a future route is not made public by accident.
  "/api/cron",
  // The doorway into the live demo. It signs the visitor in and then leaves
  // for the dashboard, so it has to be reachable before there is a session —
  // otherwise the Live demo button lands on the sign-in page, which is the
  // one place a demo should never send anybody.
  "/demo",
]

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

/**
 * Refreshes the session on every request and turns unauthenticated visitors
 * away from the application.
 *
 * The cookie juggling is deliberate and load-bearing: Supabase may hand back
 * rotated auth cookies, and they have to be written onto the response that is
 * actually returned. Building a new NextResponse later would drop them and
 * sign the user out on the next navigation.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // getUser, not getSession: this one verifies the token with the auth server
  // rather than trusting whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    // So the user lands back where they were headed once they are in.
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Someone already signed in has no use for the sign-in screens.
  if (user && ["/login", "/signup", "/forgot-password"].includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}
