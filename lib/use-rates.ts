"use client"

// The exchange rates the whole app converts with.
//
// These used to live in each browser's localStorage and only moved when
// somebody pressed "Update rates" — so a device that had never been told to
// refresh kept converting at the seeded figures indefinitely, and two devices
// could disagree about what a rupee was worth.
//
// They come from the database now, written once a day by a scheduled job. The
// app reads; it does not fetch. Pressing Update asks the job to run early
// rather than reaching for the feed itself, so every device ends up on the
// same numbers.

import * as React from "react"

import { SEED_RATES, SEED_RATES_DATE, type RateTable } from "@/lib/rate-data"
import { createClient } from "@/lib/supabase/client"
import type { Currency } from "@/lib/types"

export type RateSource = "seed" | "live"

export interface RateState {
  rates: RateTable
  /** ISO date the rates apply to. */
  updatedAt: string
  /** Whether these came off the wire or are still the built-in defaults. */
  source: RateSource
}

const SEED_STATE: RateState = {
  rates: SEED_RATES,
  updatedAt: SEED_RATES_DATE,
  source: "seed",
}

let cache: RateState = SEED_STATE
let loaded = false
let inFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function getSnapshot(): RateState {
  return cache
}

function getServerSnapshot(): RateState {
  return SEED_STATE
}

function write(next: RateState) {
  cache = next
  for (const listener of listeners) listener()
}

/** Reads the most recent day's rates. Falls back to the seed on any trouble. */
async function load(): Promise<void> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("fx_rates")
        .select("as_of, rates, source")
        .order("as_of", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data?.rates) {
        write({
          // Merged over the seed so a currency added later still has a rate
          // even if the stored row predates it.
          rates: { ...SEED_RATES, ...(data.rates as Partial<RateTable>) },
          updatedAt: data.as_of,
          source: data.source === "live" ? "live" : "seed",
        })
      }
    } finally {
      loaded = true
      inFlight = null
    }
  })()
  return inFlight
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  if (!loaded) void load()
  return () => listeners.delete(onChange)
}

/** Forgets the loaded rates. Used on sign-out, with the rest of the caches. */
export function resetRates() {
  cache = SEED_STATE
  loaded = false
  for (const listener of listeners) listener()
}

/** Today as an ISO date, in the browser's own timezone. */
export function todayISO(now = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

/**
 * Asks for a refresh now rather than waiting for the daily job, then reads
 * the result back.
 *
 * The browser no longer talks to the rates feed itself. Doing so gave whoever
 * pressed the button a private set of numbers, so two people looking at the
 * same figures could convert them differently. The function writes one row
 * that everybody then reads.
 *
 * Throws on failure so the card can say so instead of quietly keeping the old
 * numbers and looking refreshed.
 */
export async function fetchLiveRates(): Promise<RateState> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke("refresh-rates", {
    body: {},
  })
  if (error) throw new Error("Could not reach the rates service.")
  if (data?.error) throw new Error(String(data.error))

  loaded = false
  await load()
  return cache
}

export function useRates() {
  const state = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return { ...state, fetchLiveRates, resetRates }
}

/** How many whole days ago a date was. */
export function daysSince(date: string, now = new Date()): number {
  const then = new Date(`${date}T00:00:00`).getTime()
  const today = new Date(`${todayISO(now)}T00:00:00`).getTime()
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.round((today - then) / 86_400_000))
}

/** How many units of `to` one unit of `from` buys, in a given rate table. */
export function rateFor(
  table: RateTable,
  from: Currency,
  to: Currency
): number {
  return table[to] / table[from]
}
