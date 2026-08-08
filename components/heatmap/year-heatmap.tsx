"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { getEntryYear } from "@/lib/mock-data"
import { useMoney } from "@/lib/use-money"
import type { Entry, Source } from "@/lib/types"
import { cn } from "@/lib/utils"

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

// Per-day aggregation for the hover card: net decides the colour, the rest
// fills the details.
interface DayStats {
  profit: number
  loss: number
  net: number
  byCategory: Map<string, number>
  bySource: Map<string, number>
}

const greenLevels = [
  "bg-success/25 border-transparent",
  "bg-success/45 border-transparent",
  "bg-success/70 border-transparent",
  "bg-success border-transparent",
]
const redLevels = [
  "bg-destructive/25 border-transparent",
  "bg-destructive/45 border-transparent",
  "bg-destructive/70 border-transparent",
  "bg-destructive border-transparent",
]

function intensityLevel(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(3, Math.floor((Math.abs(value) / max) * 4))
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function topKey(map: Map<string, number>): string | null {
  let best: string | null = null
  let bestValue = 0
  for (const [key, value] of map) {
    if (Math.abs(value) > bestValue) {
      best = key
      bestValue = Math.abs(value)
    }
  }
  return best
}

interface YearHeatmapProps {
  entries: Entry[]
  sources: Source[]
  year: number
}

// Daily net P/L for a whole year, GitHub-contributions style. Shared by the
// Year Heatmap page and the dashboard.
export function YearHeatmap({ entries, sources, year }: YearHeatmapProps) {
  const { formatMoney } = useMoney()
  const sourceById = React.useMemo(
    () => new Map(sources.map((source) => [source.id, source.name])),
    [sources]
  )

  const dayStats = React.useMemo(() => {
    const stats = new Map<string, DayStats>()
    for (const entry of entries) {
      if (getEntryYear(entry) !== year) continue
      const isProfit = entry.type === "profit"
      const isLoss =
        entry.type === "loss" || entry.type === "fee" || entry.type === "tax"
      if (!isProfit && !isLoss) continue // p2p/transfer don't affect P/L
      const day = entry.datetime.slice(0, 10)
      const stat = stats.get(day) ?? {
        profit: 0,
        loss: 0,
        net: 0,
        byCategory: new Map(),
        bySource: new Map(),
      }
      if (isProfit) stat.profit += entry.amount
      else stat.loss += entry.amount
      stat.net = stat.profit - stat.loss
      if (entry.category) {
        stat.byCategory.set(
          entry.category,
          (stat.byCategory.get(entry.category) ?? 0) + entry.amount
        )
      }
      if (entry.sourceId) {
        const name = sourceById.get(entry.sourceId)
        if (name) {
          stat.bySource.set(name, (stat.bySource.get(name) ?? 0) + entry.amount)
        }
      }
      stats.set(day, stat)
    }
    return stats
  }, [entries, year, sourceById])

  const maxAbsNet = Math.max(
    0,
    ...Array.from(dayStats.values()).map((stat) => Math.abs(stat.net))
  )

  // Columns are weeks (starting Sunday), rows are weekdays.
  const weeks = React.useMemo(() => {
    const start = new Date(year, 0, 1)
    start.setDate(start.getDate() - start.getDay()) // back to Sunday
    const end = new Date(year, 11, 31)
    const result: Date[][] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      result.push(week)
    }
    return result
  }, [year])

  // Month label above the week containing the 1st of each month.
  const monthLabels = React.useMemo(() => {
    const labels = new Map<number, string>()
    weeks.forEach((week, index) => {
      for (const day of week) {
        if (day.getFullYear() === year && day.getDate() === 1) {
          labels.set(index, MONTH_NAMES[day.getMonth()])
        }
      }
    })
    return labels
  }, [weeks, year])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap for {year}</CardTitle>
        <CardDescription>Daily net P/L</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <div className="flex min-w-max flex-col gap-1.5">
            <div className="ml-9 flex gap-0.5">
              {weeks.map((_, index) => (
                <div key={index} className="w-3.5 shrink-0">
                  {monthLabels.has(index) ? (
                    <span className="text-xs text-muted-foreground">
                      {monthLabels.get(index)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex gap-0.5">
              <div className="flex w-8 shrink-0 flex-col gap-0.5">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((label, index) => (
                  <span
                    key={index}
                    className="flex h-3.5 items-center text-xs text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map((day) => {
                    const inYear = day.getFullYear() === year
                    const iso = toIso(day)
                    const stat = inYear ? dayStats.get(iso) : undefined
                    if (!inYear) {
                      return <div key={iso} className="size-3.5" />
                    }
                    if (!stat) {
                      return (
                        <div
                          key={iso}
                          className="size-3.5 rounded-[3px] border"
                        />
                      )
                    }
                    const level = intensityLevel(stat.net, maxAbsNet)
                    const colorClass =
                      stat.net >= 0 ? greenLevels[level] : redLevels[level]
                    const dateLabel = new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(day)
                    const topCategory = topKey(stat.byCategory)
                    const topSource = topKey(stat.bySource)
                    return (
                      <HoverCard key={iso}>
                        <HoverCardTrigger
                          render={
                            <button
                              type="button"
                              aria-label={`${dateLabel}: net ${formatMoney(stat.net, "USD")}`}
                              className={cn(
                                "size-3.5 rounded-[3px] border ring-offset-1 ring-offset-background outline-none data-popup-open:ring-2 data-popup-open:ring-ring",
                                colorClass
                              )}
                            />
                          }
                        />
                        <HoverCardContent
                          side="top"
                          className="flex w-auto min-w-52 flex-col gap-1 p-4"
                        >
                          <span className="text-muted-foreground">
                            {dateLabel}
                          </span>
                          <span
                            className={cn(
                              "text-xl font-semibold",
                              stat.net >= 0
                                ? "text-success"
                                : "text-destructive"
                            )}
                          >
                            {formatMoney(stat.net, "USD")}
                          </span>
                          <span className="text-muted-foreground">
                            Profit: {formatMoney(stat.profit, "USD")}
                          </span>
                          <span className="text-muted-foreground">
                            Loss: {formatMoney(stat.loss, "USD")}
                          </span>
                          {topCategory ? (
                            <span className="text-muted-foreground">
                              Top category: {topCategory}
                            </span>
                          ) : null}
                          {topSource ? (
                            <span className="text-muted-foreground">
                              Top source: {topSource}
                            </span>
                          ) : null}
                        </HoverCardContent>
                      </HoverCard>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Loss</span>
          <div className="flex gap-0.5">
            {[...redLevels].reverse().map((cls) => (
              <div
                key={cls}
                className={cn("size-3.5 rounded-[3px] border", cls)}
              />
            ))}
          </div>
          <div className="size-3.5 rounded-[3px] border" />
          <div className="flex gap-0.5">
            {greenLevels.map((cls) => (
              <div
                key={cls}
                className={cn("size-3.5 rounded-[3px] border", cls)}
              />
            ))}
          </div>
          <span>Profit</span>
        </div>
      </CardContent>
    </Card>
  )
}
