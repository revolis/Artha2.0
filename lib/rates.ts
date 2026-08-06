// Presentation helpers for the currency converter. The rates themselves live
// in lib/rate-data.ts (seeded, real) and lib/use-rates.ts (what the user has
// recorded since) — nothing here invents a number.

import type { RateSnapshot } from "@/lib/rate-data"
import { rateFor } from "@/lib/use-rates"
import type { Currency } from "@/lib/types"

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "United States Dollar",
  NPR: "Nepalese Rupee",
  INR: "Indian Rupee",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
}

export interface RatePoint {
  /** ISO date, e.g. "2026-08-05". */
  date: string
  rate: number
}

export const RATE_RANGES = [
  { value: "3m", label: "3M", days: 92 },
  { value: "6m", label: "6M", days: 183 },
  { value: "1y", label: "1Y", days: 365 },
] as const

export type RateRange = (typeof RATE_RANGES)[number]["value"]

/**
 * The recorded rate for one pair over the last `days`, oldest first. Every
 * point is a reading that was actually taken — there is no interpolation, so
 * a sparse history simply draws fewer points.
 */
export function buildRateHistory(
  history: RateSnapshot[],
  from: Currency,
  to: Currency,
  days: number,
  endDate: string
): RatePoint[] {
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(end.getTime())) return []
  const start = new Date(end.getTime() - days * 86_400_000)
    .toISOString()
    .slice(0, 10)

  return history
    .filter((entry) => entry.date >= start && entry.date <= endDate)
    .map((entry) => ({
      date: entry.date,
      rate: rateFor(entry.rates, from, to),
    }))
}

/** Rounds sensibly for the currency: no paisa on rupee amounts. */
export function formatRateNumber(value: number, currency: Currency): string {
  const decimals = currency === "NPR" || currency === "INR" ? 2 : 4
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value >= 100 ? 2 : decimals,
  }).format(value)
}

export function formatAmountNumber(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 2 : 4,
  }).format(value)
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
