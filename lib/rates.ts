// Exchange-rate helpers for the currency converter.
//
// During the design phase the rates come from USD_RATES in mock-data and the
// history below is generated, not real. When the daily sync is added later,
// only getRate/getRateHistory need to change — nothing that calls them does.

import { USD_RATES } from "@/lib/mock-data"
import type { Currency } from "@/lib/types"

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "United States Dollar",
  NPR: "Nepalese Rupee",
  INR: "Indian Rupee",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
}

/** How many units of `to` one unit of `from` buys. */
export function getRate(from: Currency, to: Currency): number {
  return USD_RATES[to] / USD_RATES[from]
}

export interface RatePoint {
  /** ISO date, e.g. "2026-08-04". */
  date: string
  rate: number
}

/**
 * A repeatable pseudo-random number in 0…1. Integer maths only, so the server
 * and the browser generate byte-identical charts and hydration stays happy.
 */
function noise(seed: number): number {
  let x = seed | 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
  x = x ^ (x >>> 16)
  return (x >>> 0) / 4294967296
}

function seedFor(from: Currency, to: Currency): number {
  const key = `${from}${to}`
  let seed = 7
  for (let i = 0; i < key.length; i += 1) {
    seed = Math.imul(seed, 31) + key.charCodeAt(i)
  }
  return seed
}

/**
 * A plausible daily series ending exactly on today's rate. Generated, not
 * historical — it's here so the chart has a shape until real data arrives.
 */
export function getRateHistory(
  from: Currency,
  to: Currency,
  days: number,
  endDate: string
): RatePoint[] {
  const rate = getRate(from, to)
  const end = new Date(`${endDate}T00:00:00Z`)
  if (Number.isNaN(end.getTime())) return []

  const seed = seedFor(from, to)
  // A slow upward drift with day-to-day wobble on top.
  const drift = 0.00028
  const volatility = 0.0045

  const walk: number[] = [1]
  for (let i = 1; i < days; i += 1) {
    const step = drift + (noise(seed + i) - 0.5) * volatility
    walk.push(walk[i - 1] * (1 + step))
  }

  // Rescale so the final point is exactly the rate we quote elsewhere.
  const scale = rate / walk[walk.length - 1]

  return walk.map((value, index) => {
    const date = new Date(end)
    date.setUTCDate(date.getUTCDate() - (days - 1 - index))
    return { date: date.toISOString().slice(0, 10), rate: value * scale }
  })
}

export const RATE_RANGES = [
  { value: "1m", label: "1M", days: 30 },
  { value: "6m", label: "6M", days: 182 },
  { value: "1y", label: "1Y", days: 365 },
] as const

export type RateRange = (typeof RATE_RANGES)[number]["value"]

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
