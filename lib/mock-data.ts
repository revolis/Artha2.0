// Mock data for the design phase. No backend — everything the UI shows
// comes from here (seeded into localStorage-backed stores by lib/local-store.ts).

import { SEED_RATES, type RateTable } from "@/lib/rate-data"
import type {
  AppSettings,
  Currency,
  Entry,
  Goal,
  Source,
  UserProfile,
} from "@/lib/types"

export const mockUser: UserProfile = {
  id: "u_1",
  username: "rajan",
  name: "Rajan",
  email: "thematrixogs@gmail.com",
  avatarId: "aurora",
  bio: "Tracking crypto, stocks and cash income in one place.",
  location: "Kathmandu, Nepal",
  timezone: "Asia/Kathmandu",
  website: "",
  socials: [
    { id: "sl_1", platform: "X", url: "https://x.com/" },
    { id: "sl_2", platform: "GitHub", url: "https://github.com/" },
    { id: "sl_3", platform: "Telegram", url: "https://telegram.org/" },
  ],
  createdAt: "2024-01-15",
}

export const mockSettings: AppSettings = {
  displayCurrency: "USD",
  language: "en",
  timezone: "Asia/Kathmandu",
  timeFormat: "12h",
  notifications: {
    goalMilestones: { inApp: true, email: true },
    weeklySummary: { inApp: true, email: false },
    monthlyReport: { inApp: true, email: true },
    largeEntries: { inApp: true, email: false },
    rateSync: { inApp: false, email: false },
    productNews: { inApp: false, email: false },
  },
  privacyMode: false,
  loginMethod: "google",
  hasPassword: false,
  twoFactor: false,
}

// The currency every amount is rendered in. Held at module level so the
// existing formatMoney(amount, "USD") call sites across the app pick up the
// user's choice without each one having to thread settings through.
let displayCurrency: Currency = mockSettings.displayCurrency
let privacyMode = mockSettings.privacyMode

// The rates every conversion uses. Starts at the seeded real rates and is
// replaced whenever the user records a newer set (see lib/use-rates.ts).
let activeRates: RateTable = { ...SEED_RATES }

export function setActiveRates(next: RateTable) {
  activeRates = next
}

export function getActiveRates(): RateTable {
  return activeRates
}

export function setDisplayCurrency(currency: Currency) {
  displayCurrency = currency
}

export function getDisplayCurrency(): Currency {
  return displayCurrency
}

/** Masks every formatted amount without touching the underlying data. */
export function setPrivacyMode(enabled: boolean) {
  privacyMode = enabled
}

export function isPrivacyMode(): boolean {
  return privacyMode
}

export const mockSources: Source[] = [
  {
    id: "s_1",
    name: "Binance",
    socialHandle: "@binance",
    platformUrl: "https://www.binance.com",
  },
  {
    id: "s_2",
    name: "Binance Alpha",
    socialHandle: "@binance",
    platformUrl: "https://www.binance.com/en/alpha",
    campaignUrl: "https://www.binance.com/en/alpha/events",
  },
  {
    id: "s_3",
    name: "Bitget",
    socialHandle: "@bitgetglobal",
    platformUrl: "https://www.bitget.com",
  },
  {
    id: "s_4",
    name: "Polymarket",
    socialHandle: "@Polymarket",
    platformUrl: "https://polymarket.com",
  },
  {
    id: "s_5",
    name: "Local P2P — Ram",
    socialHandle: "@ram_trades",
  },
]

export const mockEntries: Entry[] = [
  // 2026
  {
    id: "e_26_11",
    datetime: "2026-07-21T14:20",
    type: "profit",
    category: "Prediction Market",
    tags: ["airdrop-season"],
    sourceId: "s_4",
    amount: 73.28,
    note: "US election market resolved in my favor.",
  },
  {
    id: "e_26_10",
    datetime: "2026-06-30T21:05",
    type: "profit",
    category: "Simple Earn (APR)",
    tags: ["passive"],
    sourceId: "s_1",
    amount: 53,
    note: "Monthly APR payout.",
  },
  {
    id: "e_26_9",
    datetime: "2026-06-30T18:40",
    type: "profit",
    category: "Binance Alpha",
    tags: ["airdrop-season", "alpha"],
    sourceId: "s_2",
    amount: 437.42,
    note: "Alpha points redemption — best drop this quarter.",
    attachments: [{ name: "alpha-payout.png" }],
  },
  {
    id: "e_26_8",
    datetime: "2026-06-28T11:15",
    type: "loss",
    category: "Prediction Market",
    tags: [],
    sourceId: "s_4",
    amount: 50,
    note: "Sports market went the wrong way.",
  },
  {
    id: "e_26_7",
    datetime: "2026-06-22T09:30",
    type: "loss",
    category: "PreMarket",
    tags: ["premarket"],
    sourceId: "s_3",
    amount: 27,
  },
  {
    id: "e_26_6",
    datetime: "2026-05-28T16:00",
    type: "profit",
    category: "IDO",
    tags: ["launchpad"],
    sourceId: "s_3",
    amount: 145.3,
  },
  {
    id: "e_26_5",
    datetime: "2026-05-05T13:45",
    type: "p2p",
    category: "P2P Cash",
    tags: ["npr-cashout"],
    sourceId: "s_5",
    amount: 208,
    p2p: {
      direction: "usd-to-cash",
      cashCurrency: "NPR",
      rate: 139.5,
      cashAmount: 29016,
    },
    note: "Sold USDT for NPR cash.",
  },
  {
    id: "e_26_4",
    datetime: "2026-04-17T19:10",
    type: "fee",
    category: "Withdrawal Fee",
    tags: [],
    sourceId: "s_1",
    amount: 4.6,
  },
  {
    id: "e_26_3",
    datetime: "2026-03-21T10:00",
    type: "profit",
    category: "Binance Alpha",
    tags: ["alpha"],
    sourceId: "s_2",
    amount: 315,
    attachments: [{ name: "march-alpha.png" }, { name: "march-alpha-2.png" }],
  },
  {
    id: "e_26_2",
    datetime: "2026-02-08T15:30",
    type: "profit",
    category: "Binance Alpha",
    tags: ["alpha"],
    sourceId: "s_2",
    amount: 187.4,
  },
  {
    id: "e_26_1",
    datetime: "2026-01-15T12:00",
    type: "profit",
    category: "Simple Earn (APR)",
    tags: ["passive"],
    sourceId: "s_1",
    amount: 96.2,
  },
  // 2025
  {
    id: "e_25_4",
    datetime: "2025-12-19T17:25",
    type: "profit",
    category: "Launchpool",
    tags: ["launchpad"],
    sourceId: "s_3",
    amount: 240.5,
  },
  {
    id: "e_25_3",
    datetime: "2025-06-30T20:00",
    type: "profit",
    category: "Binance Alpha",
    tags: ["alpha"],
    sourceId: "s_2",
    amount: 452.1,
  },
  {
    id: "e_25_2",
    datetime: "2025-04-09T14:00",
    type: "loss",
    category: "Prediction Market",
    tags: [],
    sourceId: "s_4",
    amount: 61.25,
  },
  {
    id: "e_25_1",
    datetime: "2025-01-18T09:45",
    type: "profit",
    category: "Airdrop",
    tags: ["airdrop-season"],
    sourceId: "s_1",
    amount: 310.4,
  },
  // 2024
  {
    id: "e_24_2",
    datetime: "2024-10-21T18:30",
    type: "profit",
    category: "Airdrop",
    tags: ["airdrop-season"],
    sourceId: "s_1",
    amount: 95,
  },
  {
    id: "e_24_1",
    datetime: "2024-03-12T11:20",
    type: "p2p",
    category: "P2P Cash",
    tags: ["npr-cashout"],
    sourceId: "s_5",
    amount: 120,
    p2p: {
      direction: "cash-to-usd",
      cashCurrency: "NPR",
      rate: 132.8,
      cashAmount: 15936,
    },
  },
]

// Money in minus money out. Profit adds; loss, fee, and tax subtract;
// p2p and transfer just move money around, so they don't count.
export function getNetAmount(entry: Entry): number {
  if (entry.type === "profit") return entry.amount
  if (entry.type === "loss" || entry.type === "fee" || entry.type === "tax") {
    return -entry.amount
  }
  return 0
}

export function getEntryYear(entry: Entry): number {
  return Number(entry.datetime.slice(0, 4))
}

// Average monthly income for a year, in USD, from real entries.
// Past years divide by 12; the current year divides by months elapsed so far.
export function getAvgMonthlyIncome(
  entries: Entry[],
  year: number,
  now = new Date()
): number {
  if (year > now.getFullYear()) return 0
  const total = entries
    .filter((entry) => getEntryYear(entry) === year)
    .reduce((sum, entry) => sum + getNetAmount(entry), 0)
  const months = year === now.getFullYear() ? now.getMonth() + 1 : 12
  return total / months
}

export function convertFromUsd(amountUsd: number, to: Currency): number {
  return amountUsd * activeRates[to]
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return amount
  return (amount / activeRates[from]) * activeRates[to]
}

const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: "en-US",
  NPR: "en-IN",
  INR: "en-IN",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
}

/**
 * Formats an amount for display. `currency` is the currency the amount is
 * stored in — the result is converted into whatever the user has picked as
 * their display currency, so one setting changes every figure on the site.
 */
export function formatMoney(amount: number, currency: Currency): string {
  if (privacyMode) return "••••••"
  const target = displayCurrency
  const converted = convertCurrency(amount, currency, target)
  return new Intl.NumberFormat(CURRENCY_LOCALES[target], {
    style: "currency",
    currency: target,
    maximumFractionDigits: target === "NPR" || target === "INR" ? 0 : 2,
  }).format(converted)
}

// Seed goals cover every status the card can show: on track, behind pace,
// completed early, and timeframe ended without completing.
export const mockGoals: Goal[] = [
  {
    id: "g_1",
    title: "Target Of 2k26",
    targetAmount: 14999.98,
    currentAmount: 3237.88,
    currency: "USD",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    showOnDashboard: true,
  },
  {
    id: "g_2",
    title: "Emergency Fund",
    targetAmount: 5000,
    currentAmount: 4100,
    currency: "USD",
    startDate: "2026-01-01",
    endDate: "2026-06-30",
    showOnDashboard: true,
  },
  {
    id: "g_3",
    title: "New Laptop",
    targetAmount: 1800,
    currentAmount: 540,
    currency: "USD",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
  },
  {
    id: "g_4",
    title: "Phone Upgrade",
    targetAmount: 900,
    currentAmount: 900,
    currency: "USD",
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    completedAt: "2026-05-20",
  },
]
