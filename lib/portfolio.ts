// Portfolio math: how entries move your USD balance, plus the summary,
// ranking, and insight numbers shown on the Portfolio page.

import { getEntryYear, getNetAmount } from "@/lib/mock-data"
import type { Entry } from "@/lib/types"

// How much an entry changes the USD portfolio.
// Profit adds; loss, fee, and tax subtract. Selling USD for cash takes USD
// out; buying USD with cash puts it back in. Transfers just move money.
export function getPortfolioDelta(entry: Entry): number {
  switch (entry.type) {
    case "profit":
      return entry.amount
    case "loss":
    case "fee":
    case "tax":
      return -entry.amount
    case "p2p":
      return entry.p2p?.direction === "cash-to-usd"
        ? entry.amount
        : -entry.amount
    default:
      return 0
  }
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export interface SeriesPoint {
  date: string
  value: number
}

// One point per day of the year, carrying the running balance forward so the
// line stays continuous between entries.
export function buildDailySeries(
  entries: Entry[],
  year: number,
  now = new Date()
): SeriesPoint[] {
  const byDay = new Map<string, number>()
  for (const entry of entries) {
    if (getEntryYear(entry) !== year) continue
    const day = entry.datetime.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + getPortfolioDelta(entry))
  }

  const end =
    year === now.getFullYear()
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(year, 11, 31)

  const series: SeriesPoint[] = []
  const cursor = new Date(year, 0, 1)
  let running = 0
  while (cursor <= end) {
    const iso = toIso(cursor)
    running += byDay.get(iso) ?? 0
    series.push({ date: iso, value: running })
    cursor.setDate(cursor.getDate() + 1)
  }
  return series
}

export interface PortfolioStats {
  grossIncome: number // all profit
  loss: number // all loss
  fees: number
  taxes: number
  netIncome: number // gross − loss − fees − taxes
  cashOut: number // USD sold for cash
  cashIn: number // USD bought with cash
  portfolioValue: number // netIncome − cashOut + cashIn
  entryCount: number
}

export function getPortfolioStats(
  entries: Entry[],
  year: number
): PortfolioStats {
  const stats: PortfolioStats = {
    grossIncome: 0,
    loss: 0,
    fees: 0,
    taxes: 0,
    netIncome: 0,
    cashOut: 0,
    cashIn: 0,
    portfolioValue: 0,
    entryCount: 0,
  }
  for (const entry of entries) {
    if (getEntryYear(entry) !== year) continue
    stats.entryCount += 1
    switch (entry.type) {
      case "profit":
        stats.grossIncome += entry.amount
        break
      case "loss":
        stats.loss += entry.amount
        break
      case "fee":
        stats.fees += entry.amount
        break
      case "tax":
        stats.taxes += entry.amount
        break
      case "p2p":
        if (entry.p2p?.direction === "cash-to-usd") stats.cashIn += entry.amount
        else stats.cashOut += entry.amount
        break
    }
  }
  stats.netIncome =
    stats.grossIncome - stats.loss - stats.fees - stats.taxes
  stats.portfolioValue = stats.netIncome - stats.cashOut + stats.cashIn
  return stats
}

export type ContributorKind = "category" | "source"

export interface Contributor {
  name: string
  kind: ContributorKind
  net: number
  gross: number
  count: number
  lastDate: string // most recent entry date, for the row sub-line
}

// Rank categories or sources by their net contribution to the year.
export function getContributors(
  entries: Entry[],
  year: number,
  kind: ContributorKind,
  keyOf: (entry: Entry) => string | undefined
): Contributor[] {
  const map = new Map<string, Contributor>()
  for (const entry of entries) {
    if (getEntryYear(entry) !== year) continue
    if (entry.type === "p2p" || entry.type === "transfer") continue
    const name = keyOf(entry)
    if (!name) continue
    const current = map.get(name) ?? {
      name,
      kind,
      net: 0,
      gross: 0,
      count: 0,
      lastDate: entry.datetime,
    }
    current.net += getPortfolioDelta(entry)
    if (entry.type === "profit") current.gross += entry.amount
    current.count += 1
    if (entry.datetime > current.lastDate) current.lastDate = entry.datetime
    map.set(name, current)
  }
  return Array.from(map.values()).sort((a, b) => b.net - a.net)
}

export interface PortfolioInsights {
  winRate: number | null // share of profit entries vs profit+loss entries
  wins: number
  losses: number
  bestDay: { date: string; value: number } | null
  worstDay: { date: string; value: number } | null
  avgWin: number
  activeDays: number
  concentration: number | null // top source's share of gross income
  topSourceName: string | null
  thisMonthNet: number
  lastMonthNet: number
}

export function getPortfolioInsights(
  entries: Entry[],
  year: number,
  topSource: Contributor | undefined,
  grossIncome: number,
  now = new Date()
): PortfolioInsights {
  let wins = 0
  let losses = 0
  let winTotal = 0
  const byDay = new Map<string, number>()
  let thisMonthNet = 0
  let lastMonthNet = 0

  const thisMonth = now.getMonth()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? year - 1 : year

  for (const entry of entries) {
    const entryYear = getEntryYear(entry)
    const month = Number(entry.datetime.slice(5, 7)) - 1

    if (entryYear === year && month === thisMonth) {
      thisMonthNet += getPortfolioDelta(entry)
    }
    if (entryYear === lastMonthYear && month === lastMonth) {
      lastMonthNet += getPortfolioDelta(entry)
    }
    if (entryYear !== year) continue

    if (entry.type === "profit") {
      wins += 1
      winTotal += entry.amount
    } else if (entry.type === "loss") {
      losses += 1
    }
    // Best/worst day measure profit and loss only — moving USD to or from
    // cash isn't winning or losing money.
    if (entry.type !== "transfer") {
      const day = entry.datetime.slice(0, 10)
      byDay.set(day, (byDay.get(day) ?? 0) + getNetAmount(entry))
    }
  }

  let bestDay: { date: string; value: number } | null = null
  let worstDay: { date: string; value: number } | null = null
  for (const [date, value] of byDay) {
    if (!bestDay || value > bestDay.value) bestDay = { date, value }
    if (!worstDay || value < worstDay.value) worstDay = { date, value }
  }

  return {
    winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : null,
    wins,
    losses,
    bestDay: bestDay && bestDay.value > 0 ? bestDay : null,
    worstDay: worstDay && worstDay.value < 0 ? worstDay : null,
    avgWin: wins > 0 ? winTotal / wins : 0,
    activeDays: byDay.size,
    concentration:
      topSource && grossIncome > 0
        ? (topSource.gross / grossIncome) * 100
        : null,
    topSourceName: topSource?.name ?? null,
    thisMonthNet,
    lastMonthNet,
  }
}
