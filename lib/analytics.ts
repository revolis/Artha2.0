// Analytics aggregations: monthly performance, standout transactions,
// and per-source / per-category / per-weekday breakdowns.
//
// Everything here measures profit and loss only. Fiat/P2P and transfers move
// money between forms rather than earning or losing it, so they are excluded.

import { getEntryYear, getNetAmount } from "@/lib/mock-data"
import type { Entry } from "@/lib/types"

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const WEEKDAY_LABELS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
]

export function isIncome(entry: Entry): boolean {
  return entry.type === "profit"
}

export function isExpense(entry: Entry): boolean {
  return entry.type === "loss" || entry.type === "fee" || entry.type === "tax"
}

function countsTowardPerformance(entry: Entry): boolean {
  return isIncome(entry) || isExpense(entry)
}

export interface MonthPerformance {
  month: number
  label: string
  income: number
  expense: number
  net: number
  count: number
  topCategory: string | null
  activeDays: number
}

export function getMonthlyPerformance(
  entries: Entry[],
  year: number
): MonthPerformance[] {
  const months: MonthPerformance[] = MONTH_LABELS.map((label, month) => ({
    month,
    label,
    income: 0,
    expense: 0,
    net: 0,
    count: 0,
    topCategory: null,
    activeDays: 0,
  }))
  const categoryTotals = MONTH_LABELS.map(() => new Map<string, number>())
  const days = MONTH_LABELS.map(() => new Set<string>())

  for (const entry of entries) {
    if (getEntryYear(entry) !== year) continue
    if (!countsTowardPerformance(entry)) continue
    const month = Number(entry.datetime.slice(5, 7)) - 1
    const bucket = months[month]
    if (isIncome(entry)) bucket.income += entry.amount
    else bucket.expense += entry.amount
    bucket.net += getNetAmount(entry)
    bucket.count += 1
    days[month].add(entry.datetime.slice(0, 10))
    if (entry.category) {
      categoryTotals[month].set(
        entry.category,
        (categoryTotals[month].get(entry.category) ?? 0) + getNetAmount(entry)
      )
    }
  }

  for (const bucket of months) {
    bucket.activeDays = days[bucket.month].size
    let best: string | null = null
    let bestValue = -Infinity
    for (const [name, value] of categoryTotals[bucket.month]) {
      if (value > bestValue) {
        best = name
        bestValue = value
      }
    }
    bucket.topCategory = best
  }

  return months
}

// Best and lowest months, considering only months that actually had activity.
export function getMonthExtremes(months: MonthPerformance[]): {
  best: MonthPerformance | null
  lowest: MonthPerformance | null
} {
  const active = months.filter((month) => month.count > 0)
  if (active.length === 0) return { best: null, lowest: null }
  const sorted = [...active].sort((a, b) => b.net - a.net)
  return {
    best: sorted[0],
    lowest: sorted.length > 1 ? sorted[sorted.length - 1] : null,
  }
}

export function getTopTransactions(
  entries: Entry[],
  year: number,
  kind: "income" | "expense",
  limit = 5
): Entry[] {
  const match = kind === "income" ? isIncome : isExpense
  return entries
    .filter((entry) => getEntryYear(entry) === year && match(entry))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

export interface PerformanceRow {
  name: string
  count: number
  income: number
  expense: number
  net: number
  wins: number
  losses: number
  winRate: number | null
  avgPerEntry: number
  share: number // share of total income for the year
}

export function getPerformanceBreakdown(
  entries: Entry[],
  year: number,
  keyOf: (entry: Entry) => string | undefined
): PerformanceRow[] {
  const map = new Map<string, PerformanceRow>()
  let totalIncome = 0

  for (const entry of entries) {
    if (getEntryYear(entry) !== year) continue
    if (!countsTowardPerformance(entry)) continue
    const name = keyOf(entry)
    if (!name) continue

    const row = map.get(name) ?? {
      name,
      count: 0,
      income: 0,
      expense: 0,
      net: 0,
      wins: 0,
      losses: 0,
      winRate: null,
      avgPerEntry: 0,
      share: 0,
    }
    if (isIncome(entry)) {
      row.income += entry.amount
      row.wins += 1
      totalIncome += entry.amount
    } else {
      row.expense += entry.amount
      row.losses += 1
    }
    row.net += getNetAmount(entry)
    row.count += 1
    map.set(name, row)
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      winRate:
        row.wins + row.losses > 0
          ? (row.wins / (row.wins + row.losses)) * 100
          : null,
      avgPerEntry: row.count > 0 ? row.net / row.count : 0,
      share: totalIncome > 0 ? (row.income / totalIncome) * 100 : 0,
    }))
    .sort((a, b) => b.net - a.net)
}

export interface WeekdayPerformance {
  day: number
  label: string
  net: number
  count: number
}

export function getWeekdayPerformance(
  entries: Entry[],
  year: number
): WeekdayPerformance[] {
  const days: WeekdayPerformance[] = WEEKDAY_LABELS.map((label, day) => ({
    day,
    label,
    net: 0,
    count: 0,
  }))
  for (const entry of entries) {
    if (getEntryYear(entry) !== year) continue
    if (!countsTowardPerformance(entry)) continue
    const weekday = new Date(entry.datetime).getDay()
    days[weekday].net += getNetAmount(entry)
    days[weekday].count += 1
  }
  return days
}

export type TrendTimeframe =
  | "monthly"
  | "quarterly"
  | "6months"
  | "yearly"
  | "all"

export interface TrendPoint {
  // Index signature so the array satisfies the chart's Record<string, unknown>.
  [key: string]: string | number
  label: string
  income: number
  expense: number
  net: number
}

// Net P/L bucketed for the dashboard trend chart. Monthly, quarterly and the
// six-month window stay inside the selected year; yearly and all span the
// whole history.
export function getTrendSeries(
  entries: Entry[],
  year: number,
  timeframe: TrendTimeframe,
  now = new Date()
): TrendPoint[] {
  // Accumulates income, expense and net together so the chart can draw all
  // three bars from a single pass.
  const blank = () => ({ income: 0, expense: 0, net: 0 })
  const add = (
    bucket: { income: number; expense: number; net: number },
    entry: Entry
  ) => {
    if (isIncome(entry)) bucket.income += entry.amount
    else bucket.expense += entry.amount
    bucket.net += getNetAmount(entry)
  }

  if (timeframe === "yearly") {
    const byYear = new Map<number, ReturnType<typeof blank>>()
    for (const entry of entries) {
      if (!countsTowardPerformance(entry)) continue
      const entryYear = getEntryYear(entry)
      const bucket = byYear.get(entryYear) ?? blank()
      add(bucket, entry)
      byYear.set(entryYear, bucket)
    }
    return Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([value, bucket]) => ({ label: String(value), ...bucket }))
  }

  if (timeframe === "all") {
    const byMonth = new Map<string, ReturnType<typeof blank>>()
    for (const entry of entries) {
      if (!countsTowardPerformance(entry)) continue
      const key = entry.datetime.slice(0, 7)
      const bucket = byMonth.get(key) ?? blank()
      add(bucket, entry)
      byMonth.set(key, bucket)
    }
    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, bucket]) => {
        const [yearPart, monthPart] = key.split("-")
        return {
          label: `${MONTH_LABELS[Number(monthPart) - 1]} ${yearPart.slice(2)}`,
          ...bucket,
        }
      })
  }

  const months = getMonthlyPerformance(entries, year)
  const fromMonth = (month: MonthPerformance) => ({
    label: month.label,
    income: month.income,
    expense: month.expense,
    net: month.net,
  })

  if (timeframe === "quarterly") {
    return [0, 1, 2, 3].map((quarter) => {
      const slice = months.slice(quarter * 3, quarter * 3 + 3)
      return {
        label: `Q${quarter + 1}`,
        income: slice.reduce((sum, month) => sum + month.income, 0),
        expense: slice.reduce((sum, month) => sum + month.expense, 0),
        net: slice.reduce((sum, month) => sum + month.net, 0),
      }
    })
  }

  if (timeframe === "6months") {
    const endMonth = year === now.getFullYear() ? now.getMonth() : 11
    const startMonth = Math.max(0, endMonth - 5)
    return months.slice(startMonth, endMonth + 1).map(fromMonth)
  }

  return months.map(fromMonth)
}

export interface YearTotals {
  income: number
  expense: number
  net: number
  count: number
  activeMonths: number
  monthlyAverage: number // across months that had activity
}

export function getYearTotals(months: MonthPerformance[]): YearTotals {
  const totals: YearTotals = {
    income: 0,
    expense: 0,
    net: 0,
    count: 0,
    activeMonths: 0,
    monthlyAverage: 0,
  }
  for (const month of months) {
    totals.income += month.income
    totals.expense += month.expense
    totals.net += month.net
    totals.count += month.count
    if (month.count > 0) totals.activeMonths += 1
  }
  totals.monthlyAverage =
    totals.activeMonths > 0 ? totals.net / totals.activeMonths : 0
  return totals
}
