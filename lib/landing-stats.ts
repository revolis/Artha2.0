// Figures quoted on the landing page, counted from the demo ledger itself
// rather than typed in by hand. If the ledger grows, the landing page says so.

import {
  getEntryYear,
  mockEntries,
  mockGoals,
  mockSources,
} from "@/lib/mock-data"
import { getPortfolioStats } from "@/lib/portfolio"

/** The year the demo opens on — the ledger's most recent full-ish year. */
export const DEMO_YEAR = 2026

function distinct(values: (string | undefined)[]): number {
  return new Set(values.filter((value): value is string => Boolean(value))).size
}

const years = new Set(mockEntries.map(getEntryYear))
const stats2026 = getPortfolioStats(mockEntries, DEMO_YEAR)

export const demoLedger = {
  entries: mockEntries.length,
  years: years.size,
  firstYear: Math.min(...years),
  lastYear: Math.max(...years),
  sources: mockSources.length,
  categories: distinct(mockEntries.map((entry) => entry.category)),
  tags: distinct(mockEntries.flatMap((entry) => entry.tags)),
  goals: mockGoals.length,
  /** Days that carry at least one entry, across every year. */
  activeDays: distinct(mockEntries.map((entry) => entry.datetime.slice(0, 10))),
  p2pTrades: mockEntries.filter((entry) => entry.type === "p2p").length,
  /** Currencies every amount on the site can be shown in. */
  currencies: 6,
}

/** The 2026 headline numbers, used by the live preview card. */
export const demoYearStats = stats2026
