"use client"

// The exchange rates the whole app converts with. Seeded from real rates,
// refreshed from a live feed when the user presses Update, and kept in
// localStorage so the last fetched set is what the site uses next time.

import * as React from "react"

import { setActiveRates } from "@/lib/mock-data"
import { SEED_RATES, SEED_RATES_DATE, type RateTable } from "@/lib/rate-data"
import type { Currency } from "@/lib/types"

const STORAGE_KEY = "artha.rates"

/**
 * Daily mid-market rates, served from a CDN as plain JSON. No key, no signup,
 * and CORS-open so the browser can read it directly.
 */
const RATES_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"

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

let cache: RateState | null = null
const listeners = new Set<() => void>()

function load(): RateState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RateState>
      return {
        // Merge over the seed so a currency added later still has a rate.
        rates: { ...SEED_STATE.rates, ...(parsed.rates ?? {}) },
        updatedAt: parsed.updatedAt ?? SEED_STATE.updatedAt,
        source: parsed.source === "live" ? "live" : "seed",
      }
    }
  } catch {
    // corrupted or unavailable storage — fall back to the seeded rates
  }
  return SEED_STATE
}

function getSnapshot(): RateState {
  if (cache === null) {
    cache = load()
    // Every formatMoney call across the app converts with these.
    setActiveRates(cache.rates)
  }
  return cache
}

function getServerSnapshot(): RateState {
  return SEED_STATE
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function write(next: RateState) {
  cache = next
  setActiveRates(next.rates)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage full or blocked — the change still applies for this session
  }
  for (const listener of listeners) listener()
}

/** Today as an ISO date, in the browser's own timezone. */
export function todayISO(now = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

interface RatesResponse {
  date?: string
  usd?: Record<string, number>
}

/**
 * Pulls today's mid-market rates and applies them everywhere. Throws if the
 * feed can't be reached or gives back something unusable, so the caller can
 * show the failure rather than silently keeping stale numbers.
 */
export async function fetchLiveRates(): Promise<RateState> {
  const response = await fetch(RATES_URL, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Rates feed returned ${response.status}`)
  }

  const payload = (await response.json()) as RatesResponse
  const table = payload.usd
  if (!table) {
    throw new Error("Rates feed returned an unexpected shape")
  }

  const next: RateTable = { ...SEED_RATES }
  let matched = 0
  for (const code of Object.keys(next) as Currency[]) {
    const value = table[code.toLowerCase()]
    if (typeof value === "number" && value > 0) {
      next[code] = value
      matched += 1
    }
  }
  // USD is always 1, so anything less than two means the payload was wrong.
  if (matched < 2) {
    throw new Error("Rates feed had none of the currencies we track")
  }
  next.USD = 1

  const state: RateState = {
    rates: next,
    updatedAt: payload.date ?? todayISO(),
    source: "live",
  }
  write(state)
  return state
}

/** Puts the built-in rates back. */
export function resetRates() {
  write(SEED_STATE)
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
