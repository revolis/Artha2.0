// Fetches today's exchange rates and records them.
//
// Two jobs in one. The obvious one is keeping the rates current: they used to
// sit in each browser's localStorage and only moved when somebody pressed
// "Update rates", so a device that had never been told to refresh kept
// converting at the seeded figures forever.
//
// The other is keeping the project alive. Supabase pauses a free project after
// seven days without database traffic, and this app is used in bursts — a
// handful of entries at the end of a month, then nothing. A daily call writes a
// row, which is traffic, whether or not anyone visited.
//
// Open to anyone on purpose: JWT verification is off so a scheduler can call it
// without holding a key. That is safe because it takes no input, writes only a
// public exchange rate, and is idempotent — calling it twice in a day rewrites
// the same row. It also refuses to re-fetch within the hour, so hammering it
// costs nothing.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

// Daily mid-market rates, served from a CDN as plain JSON. No key, no signup.
const RATES_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"

// The currencies Artha offers. Anything else in the feed is ignored.
const WANTED = ["USD", "NPR", "INR", "EUR", "GBP", "AED"] as const

const MIN_MINUTES_BETWEEN_FETCHES = 60

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // Reading first is deliberate: it is a database query even on the days the
  // feed is unreachable, so the project still sees traffic.
  const { data: latest } = await admin
    .from("fx_rates")
    .select("as_of, rates, fetched_at")
    .order("as_of", { ascending: false })
    .limit(1)
    .maybeSingle()

  const freshEnough =
    latest?.fetched_at &&
    Date.now() - new Date(latest.fetched_at).getTime() <
      MIN_MINUTES_BETWEEN_FETCHES * 60 * 1000

  if (freshEnough) {
    return json({
      refreshed: false,
      reason: "already fetched recently",
      asOf: latest.as_of,
    })
  }

  let payload: { date?: string; usd?: Record<string, number> }
  try {
    const res = await fetch(RATES_URL, { cache: "no-store" })
    if (!res.ok)
      return json(
        { refreshed: false, error: `feed returned ${res.status}` },
        502
      )
    payload = await res.json()
  } catch (cause) {
    return json({ refreshed: false, error: String(cause) }, 502)
  }

  const table = payload.usd
  if (!table)
    return json({ refreshed: false, error: "unexpected feed shape" }, 502)

  const rates: Record<string, number> = { USD: 1 }
  let matched = 0
  for (const code of WANTED) {
    if (code === "USD") continue
    const value = table[code.toLowerCase()]
    if (typeof value === "number" && value > 0) {
      rates[code] = value
      matched += 1
    }
  }

  // A payload missing almost everything is a broken feed, not new rates —
  // better to keep yesterday's figures than to overwrite them with nothing.
  if (matched < WANTED.length - 1) {
    return json(
      { refreshed: false, error: `feed had only ${matched} of the currencies` },
      502
    )
  }

  const asOf = payload.date ?? todayIso()

  const { error } = await admin
    .from("fx_rates")
    .upsert({
      as_of: asOf,
      rates,
      source: "live",
      fetched_at: new Date().toISOString(),
    })

  if (error) return json({ refreshed: false, error: error.message }, 500)

  return json({ refreshed: true, asOf, rates })
})
