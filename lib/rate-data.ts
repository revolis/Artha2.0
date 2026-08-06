// Exchange rates — real, never invented.
//
// SEED_RATES is only the offline starting point, used before the first
// successful fetch and if the network is unavailable. The live rates come
// from lib/use-rates.ts, which stores whatever it last fetched.

import type { Currency } from "@/lib/types"

/** Units of each currency per 1 USD. */
export type RateTable = Record<Currency, number>

export const SEED_RATES: RateTable = {
  USD: 1,
  NPR: 152.03,
  INR: 94.923259,
  EUR: 0.866754,
  GBP: 0.743189,
  AED: 3.6725,
}

/** The date SEED_RATES were taken. */
export const SEED_RATES_DATE = "2026-08-06"

/** The symbol each currency is actually written with. */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  NPR: "रू",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
}
