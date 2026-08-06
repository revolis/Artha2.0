// Presentation helpers for the Fiat Currency card. The rates themselves live
// in lib/use-rates.ts — nothing here invents a number.

import type { Currency } from "@/lib/types"

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "United States Dollar",
  NPR: "Nepalese Rupee",
  INR: "Indian Rupee",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
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
