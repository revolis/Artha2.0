// The daily job that refreshes exchange rates — and, by doing so, keeps the
// database awake.
//
// Supabase pauses a free project after seven days without traffic. Artha is
// used in bursts, a few entries at the end of a month and then nothing, so a
// quiet fortnight would put the project to sleep and take the site down with
// it. The job has to run from outside Supabase to count: a scheduler inside
// the database is not the "API call to your project" that keeps it awake.
//
// Vercel calls this on a schedule (see vercel.json). It asks the refresh-rates
// function for today's rates, which reads and writes the database — real
// traffic, on a day nobody visited.
//
// Deliberately unauthenticated. Vercel Cron will send its own header when
// CRON_SECRET is set, but the endpoint is safe without one: it takes no input,
// triggers an idempotent refresh of a public exchange rate, and the function
// behind it refuses to re-fetch within the hour.

import { NextResponse } from "next/server"

// Never prerendered or cached — a cached response would mean the database was
// never actually touched, which is the entire point of the exercise.
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not set." },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`${url}/functions/v1/refresh-rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: "{}",
      cache: "no-store",
    })

    const body = await response.json().catch(() => ({}))

    return NextResponse.json(
      { ok: response.ok, ranAt: new Date().toISOString(), ...body },
      { status: response.ok ? 200 : 502 }
    )
  } catch (cause) {
    return NextResponse.json(
      { ok: false, error: cause instanceof Error ? cause.message : String(cause) },
      { status: 502 }
    )
  }
}
