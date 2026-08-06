// Real exchange rates — not mock data.
//
// SEED_RATES is what the app starts with; the user can update them any day
// from the Currency Converter, and each update is recorded in the history so
// the chart is always drawn from figures that actually existed.
//
// Sourced from the daily currency-api dataset (exchange rates as published for
// each date). USD/NPR is set to 152.03, the mid-market rate quoted on
// 5 Aug 2026 — the feed's own snapshot for that day was 151.95, so expect
// small differences between providers.

import type { Currency } from "@/lib/types"

/** Units of each currency per 1 USD. */
export type RateTable = Record<Currency, number>

export interface RateSnapshot {
  /** ISO date the rates applied on, e.g. "2026-08-05". */
  date: string
  rates: RateTable
}

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

/**
 * Twelve months of real monthly readings, oldest first. New readings are
 * appended as the user records them.
 */
export const SEED_RATE_HISTORY: RateSnapshot[] = [
  {
    date: "2025-08-05",
    rates: {
      USD: 1,
      NPR: 140.815222,
      INR: 87.968278,
      EUR: 0.865104,
      GBP: 0.752708,
      AED: 3.6725,
    },
  },
  {
    date: "2025-09-05",
    rates: {
      USD: 1,
      NPR: 140.982445,
      INR: 88.072744,
      EUR: 0.857278,
      GBP: 0.743527,
      AED: 3.6725,
    },
  },
  {
    date: "2025-10-05",
    rates: {
      USD: 1,
      NPR: 142.082553,
      INR: 88.75999,
      EUR: 0.851832,
      GBP: 0.742214,
      AED: 3.6725,
    },
  },
  {
    date: "2025-11-05",
    rates: {
      USD: 1,
      NPR: 142.030974,
      INR: 88.727768,
      EUR: 0.8701,
      GBP: 0.767878,
      AED: 3.6725,
    },
  },
  {
    date: "2025-12-05",
    rates: {
      USD: 1,
      NPR: 143.844628,
      INR: 89.86077,
      EUR: 0.858089,
      GBP: 0.750007,
      AED: 3.6725,
    },
  },
  {
    date: "2026-01-05",
    rates: {
      USD: 1,
      NPR: 144.207713,
      INR: 90.087592,
      EUR: 0.855118,
      GBP: 0.744417,
      AED: 3.6725,
    },
  },
  {
    date: "2026-02-05",
    rates: {
      USD: 1,
      NPR: 144.802513,
      INR: 90.459168,
      EUR: 0.847597,
      GBP: 0.733197,
      AED: 3.6725,
    },
  },
  {
    date: "2026-03-05",
    rates: {
      USD: 1,
      NPR: 147.509084,
      INR: 92.149982,
      EUR: 0.860304,
      GBP: 0.748447,
      AED: 3.6725,
    },
  },
  {
    date: "2026-04-05",
    rates: {
      USD: 1,
      NPR: 148.675506,
      INR: 92.878654,
      EUR: 0.868111,
      GBP: 0.757566,
      AED: 3.6725,
    },
  },
  {
    date: "2026-05-05",
    rates: {
      USD: 1,
      NPR: 152.110389,
      INR: 95.293412,
      EUR: 0.855619,
      GBP: 0.739354,
      AED: 3.672493,
    },
  },
  {
    date: "2026-06-05",
    rates: {
      USD: 1,
      NPR: 153.164206,
      INR: 95.682777,
      EUR: 0.860961,
      GBP: 0.744712,
      AED: 3.6725,
    },
  },
  {
    date: "2026-07-05",
    rates: {
      USD: 1,
      NPR: 152.707156,
      INR: 95.397255,
      EUR: 0.874018,
      GBP: 0.748906,
      AED: 3.6725,
    },
  },
  {
    date: "2026-08-05",
    rates: {
      USD: 1,
      NPR: 151.948408,
      INR: 94.923259,
      EUR: 0.866754,
      GBP: 0.743189,
      AED: 3.6725,
    },
  },
]
