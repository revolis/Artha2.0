// Mock data for the design phase. No backend — everything the UI shows
// comes from here, keyed by financial year so switching years swaps the data.

import type { Currency, Entry, Settings, UserProfile } from "@/lib/types"

export const mockUser: UserProfile = {
  id: "u_1",
  name: "Rajan",
  email: "thematrixogs@gmail.com",
  createdAt: "2024-01-15",
}

export const mockSettings: Settings = {
  displayCurrency: "USD",
  usdToNprRate: 139.5,
  rateUpdatedAt: "2026-08-04",
  theme: "system",
}

const entriesByYear: Record<number, Entry[]> = {
  2024: [
    { id: "e24-1", kind: "income", assetType: "cash", amount: 120, currency: "USD", category: "Freelance", date: "2024-03-12" },
    { id: "e24-2", kind: "income", assetType: "cash", amount: 85.5, currency: "USD", category: "Simple Earn (APR)", date: "2024-05-02" },
    { id: "e24-3", kind: "income", assetType: "cash", amount: 210, currency: "USD", category: "Binance Alpha", date: "2024-07-19" },
    { id: "e24-4", kind: "buy", assetType: "crypto", symbol: "BTC", assetName: "Bitcoin", quantity: 0.004, pricePerUnit: 61000, amount: 244, currency: "USD", date: "2024-09-08" },
    { id: "e24-5", kind: "income", assetType: "cash", amount: 95, currency: "USD", category: "Surprise Drop", date: "2024-10-21" },
    { id: "e24-6", kind: "income", assetType: "cash", amount: 160.25, currency: "USD", category: "IDO", date: "2024-12-05" },
  ],
  2025: [
    { id: "e25-1", kind: "income", assetType: "cash", amount: 310.4, currency: "USD", category: "Binance Alpha", date: "2025-01-18" },
    { id: "e25-2", kind: "income", assetType: "cash", amount: 74, currency: "USD", category: "PreMarket", date: "2025-02-26" },
    { id: "e25-3", kind: "income", assetType: "cash", amount: 128.75, currency: "USD", category: "Prediction Market", date: "2025-04-09" },
    { id: "e25-4", kind: "buy", assetType: "crypto", symbol: "ETH", assetName: "Ethereum", quantity: 0.12, pricePerUnit: 2450, amount: 294, currency: "USD", date: "2025-05-14" },
    { id: "e25-5", kind: "income", assetType: "cash", amount: 452.1, currency: "USD", category: "Binance Alpha", date: "2025-06-30" },
    { id: "e25-6", kind: "income", assetType: "cash", amount: 66, currency: "USD", category: "Simple Earn (APR)", date: "2025-08-22" },
    { id: "e25-7", kind: "income", assetType: "cash", amount: 189.99, currency: "USD", category: "IDO", date: "2025-10-11" },
    { id: "e25-8", kind: "income", assetType: "cash", amount: 240.5, currency: "USD", category: "Bitget", date: "2025-12-19" },
  ],
  2026: [
    { id: "e26-1", kind: "income", assetType: "cash", amount: 96.2, currency: "USD", category: "BINANCE", date: "2026-01-15" },
    { id: "e26-2", kind: "income", assetType: "cash", amount: 187.4, currency: "USD", category: "Binance Alpha", date: "2026-02-08" },
    { id: "e26-3", kind: "income", assetType: "cash", amount: 315, currency: "USD", category: "Binance Alpha", date: "2026-03-21" },
    { id: "e26-4", kind: "income", assetType: "cash", amount: 82.6, currency: "USD", category: "PreMarket", date: "2026-04-17" },
    { id: "e26-5", kind: "buy", assetType: "crypto", symbol: "BTC", assetName: "Bitcoin", quantity: 0.002, pricePerUnit: 104000, amount: 208, currency: "USD", date: "2026-05-05" },
    { id: "e26-6", kind: "income", assetType: "cash", amount: 145.3, currency: "USD", category: "IDO", date: "2026-05-28" },
    { id: "e26-7", kind: "income", assetType: "cash", amount: -27, currency: "USD", category: "PreMarket", date: "2026-06-22", notes: "Loss" },
    { id: "e26-8", kind: "income", assetType: "cash", amount: -50, currency: "USD", category: "Prediction Market", date: "2026-06-28", notes: "Loss" },
    { id: "e26-9", kind: "income", assetType: "cash", amount: 437.42, currency: "USD", category: "Binance Alpha", date: "2026-06-30" },
    { id: "e26-10", kind: "income", assetType: "cash", amount: 53, currency: "USD", category: "Simple Earn (APR)", date: "2026-06-30" },
    { id: "e26-11", kind: "income", assetType: "cash", amount: 73.28, currency: "USD", category: "Prediction Market", date: "2026-07-21" },
  ],
}

export function getEntriesForYear(year: number): Entry[] {
  return entriesByYear[year] ?? []
}

// Average monthly income for a year, in USD.
// Past years divide by 12; the current year divides by months elapsed so far.
export function getAvgMonthlyIncome(year: number, now = new Date()): number {
  const entries = getEntriesForYear(year)
  const totalIncome = entries
    .filter((entry) => entry.kind === "income")
    .reduce((sum, entry) => sum + entry.amount, 0)
  if (year > now.getFullYear()) return 0
  const months = year === now.getFullYear() ? now.getMonth() + 1 : 12
  return totalIncome / months
}

export function convertFromUsd(amountUsd: number, to: Currency): number {
  return to === "NPR" ? amountUsd * mockSettings.usdToNprRate : amountUsd
}

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "NPR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}
