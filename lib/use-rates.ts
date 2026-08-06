"use client"

// The exchange rates the whole app converts with, plus the record of every
// reading. Seeded from real rates, kept in localStorage, and updated by hand
// from the Currency Converter until the daily sync is connected.

import * as React from "react"

import { setActiveRates } from "@/lib/mock-data"
import {
  SEED_RATE_HISTORY,
  SEED_RATES,
  SEED_RATES_DATE,
  type RateSnapshot,
  type RateTable,
} from "@/lib/rate-data"
import type { Currency } from "@/lib/types"

const STORAGE_KEY = "artha.rates"

export interface RateState {
  rates: RateTable
  /** ISO date the current rates were recorded. */
  updatedAt: string
  /** Every reading, oldest first. */
  history: RateSnapshot[]
}

const SEED_STATE: RateState = {
  rates: SEED_RATES,
  updatedAt: SEED_RATES_DATE,
  // The current rates are themselves a reading, so the chart ends on the same
  // number the headline quotes.
  history: [...SEED_RATE_HISTORY, { date: SEED_RATES_DATE, rates: SEED_RATES }],
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
        history: parsed.history?.length ? parsed.history : SEED_STATE.history,
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

/**
 * Records a set of rates for a date. One reading per date — saving twice in a
 * day replaces the earlier one rather than cluttering the history.
 */
export function saveRates(rates: RateTable, date = todayISO()) {
  const current = getSnapshot()
  const history = current.history.filter((entry) => entry.date !== date)
  history.push({ date, rates })
  history.sort((a, b) => a.date.localeCompare(b.date))

  write({ rates, updatedAt: date, history })
}

/** Puts the seeded real rates back, discarding anything recorded since. */
export function resetRates() {
  write(SEED_STATE)
}

export function useRates() {
  const state = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return { ...state, saveRates, resetRates }
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
