"use client"

import * as React from "react"
import { Activity, Info } from "@/components/icons"

import { AppShell } from "@/components/layout/app-shell"
import { GrowthContributors } from "@/components/portfolio/growth-contributors"
import { Area, AreaChart } from "@/components/charts/area-chart"
import { Grid } from "@/components/charts/grid"
import { XAxis } from "@/components/charts/x-axis"
import { ChartTooltip } from "@/components/charts/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatMoney, getNetAmount } from "@/lib/mock-data"
import { StatCard } from "@/components/stats/stat-card"
import {
  buildDualDailySeries,
  getContributors,
  getPortfolioDelta,
  getPortfolioStats,
} from "@/lib/portfolio"
import { monthBucketsForYear, toStatPoints, trendOf } from "@/lib/stat-series"
import type { Entry } from "@/lib/types"
import { useSettings } from "@/lib/use-settings"
import { useEntryData } from "@/lib/use-entry-data"

type Preset = "7d" | "30d" | "90d" | "ytd" | "custom"

const presets: { value: Preset; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "ytd", label: "YTD" },
  { value: "custom", label: "Customise" },
]

const PORTFOLIO_COLOR = "var(--chart-line-primary)"
const INCOME_COLOR = "var(--chart-line-secondary)"

// Accepts a Date (chart series) or an ISO day string (insight dates).
function formatDay(value: Date | string): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function PortfolioPage() {
  // Subscribing re-renders every amount when the display currency changes.
  useSettings()
  const { entries, sources } = useEntryData()
  const year = new Date().getFullYear()

  const [preset, setPreset] = React.useState<Preset>("ytd")
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")

  const sourceById = React.useMemo(
    () => new Map(sources.map((s) => [s.id, s.name])),
    [sources]
  )

  const fullSeries = React.useMemo(
    () => buildDualDailySeries(entries, year),
    [entries, year]
  )

  const series = React.useMemo(() => {
    if (preset === "ytd") return fullSeries
    if (preset === "custom") {
      const from = customFrom ? new Date(`${customFrom}T00:00:00`) : null
      const to = customTo ? new Date(`${customTo}T23:59:59`) : null
      return fullSeries.filter(
        (point) => (!from || point.date >= from) && (!to || point.date <= to)
      )
    }
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90
    return fullSeries.slice(-days)
  }, [fullSeries, preset, customFrom, customTo])

  const stats = React.useMemo(
    () => getPortfolioStats(entries, year),
    [entries, year]
  )

  const contributors = React.useMemo(
    () => [
      ...getContributors(entries, year, "category", (entry) => entry.category),
      ...getContributors(entries, year, "source", (entry) =>
        entry.sourceId ? sourceById.get(entry.sourceId) : undefined
      ),
    ],
    [entries, year, sourceById]
  )

  // Monthly points behind each summary card. Portfolio value is cumulative —
  // it's a running balance, not a per-month figure.
  const cardSeries = React.useMemo(() => {
    const buckets = monthBucketsForYear(entries, year)
    const sum = (pick: (entry: Entry) => number) => (rows: Entry[]) =>
      rows.reduce((total, entry) => total + pick(entry), 0)

    const isCashOut = (entry: Entry) =>
      entry.type === "p2p" && entry.p2p?.direction === "usd-to-cash"
    const isCashIn = (entry: Entry) =>
      entry.type === "p2p" && entry.p2p?.direction === "cash-to-usd"

    const portfolio = toStatPoints(buckets, sum(getPortfolioDelta), {
      cumulative: true,
    })
    const netIncome = toStatPoints(buckets, sum(getNetAmount))
    const grossIncome = toStatPoints(
      buckets,
      sum((entry) => (entry.type === "profit" ? entry.amount : 0))
    )
    const loss = toStatPoints(
      buckets,
      sum((entry) =>
        entry.type === "loss" || entry.type === "fee" || entry.type === "tax"
          ? entry.amount
          : 0
      )
    )
    const cashOut = toStatPoints(
      buckets,
      sum((entry) => (isCashOut(entry) ? entry.amount : 0))
    )
    const cashIn = toStatPoints(
      buckets,
      sum((entry) => (isCashIn(entry) ? entry.amount : 0))
    )

    return {
      portfolio: { data: portfolio, trend: trendOf(portfolio) },
      netIncome: { data: netIncome, trend: trendOf(netIncome) },
      grossIncome: { data: grossIncome, trend: trendOf(grossIncome) },
      loss: { data: loss, trend: trendOf(loss) },
      cashOut: { data: cashOut, trend: trendOf(cashOut) },
      cashIn: { data: cashIn, trend: trendOf(cashIn) },
    }
  }, [entries, year])

  const first = series[0]
  const last = series[series.length - 1]

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Portfolio
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Portfolio Overview for {year}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[preset]}
            onValueChange={(value: string[]) => {
              if (value[0]) setPreset(value[0] as Preset)
            }}
          >
            {presets.map((item) => (
              <ToggleGroupItem key={item.value} value={item.value}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {preset === "custom" ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="From date"
                className="w-36"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                aria-label="To date"
                className="w-36"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          {/* The portfolio's size, in the chart's own line colour rather than
              a profit-or-loss green. */}
          <div className="flex flex-wrap items-baseline gap-3">
            <span
              className="text-4xl font-semibold tabular-nums"
              style={{ color: PORTFOLIO_COLOR }}
            >
              {formatMoney(last ? last.portfolio : 0, "USD")}
            </span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="How this is calculated"
                    className="text-muted-foreground"
                  />
                }
              >
                <Info className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                Running USD balance: profit adds; loss, fees and tax subtract;
                selling USD for cash removes it; buying USD adds it back.
              </TooltipContent>
            </Tooltip>
          </div>

          {series.length < 2 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Activity />
                </EmptyMedia>
                <EmptyTitle>Not enough data for this range</EmptyTitle>
                <EmptyDescription>
                  Pick a longer range, or add entries to build the curve.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <AreaChart
                data={series}
                xDataKey="date"
                className="w-full"
                style={{ aspectRatio: "auto", height: 300 }}
                margin={{ top: 24, right: 24, bottom: 32, left: 24 }}
                // Same treatment as the dashboard card: fit the axis to the
                // balance instead of anchoring at zero, and land on a new
                // scale immediately when the range changes.
                yBaseline="auto"
                yDomainTween={false}
              >
                <Grid horizontal />
                <XAxis />
                {/* Gross sits behind — it ignores cash moving in and out, so it
                    runs above the net line whenever you've cashed out. */}
                <Area dataKey="netIncome" fill={INCOME_COLOR} />
                <Area dataKey="portfolio" fill={PORTFOLIO_COLOR} />
                {/* Row order has to match the <Area> order above: the tooltip
                    colours each line's dot from the row at the same index. It
                    also puts gross on top, the way the lines sit on the chart. */}
                <ChartTooltip
                  rows={(point) => [
                    {
                      color: INCOME_COLOR,
                      label: "Gross Portfolio Value",
                      value: formatMoney(Number(point.netIncome), "USD"),
                    },
                    {
                      color: PORTFOLIO_COLOR,
                      label: "Net Portfolio Value",
                      value: formatMoney(Number(point.portfolio), "USD"),
                    },
                  ]}
                />
              </AreaChart>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-0.5 w-4 rounded-full"
                    style={{ backgroundColor: PORTFOLIO_COLOR }}
                  />
                  Net Portfolio Value
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-0.5 w-4 rounded-full"
                    style={{ backgroundColor: INCOME_COLOR }}
                  />
                  Gross Portfolio Value
                </span>
              </div>
              <Separator />
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs tracking-wider text-muted-foreground uppercase">
                    {formatDay(first.date)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(first.portfolio, "USD")}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs tracking-wider text-muted-foreground uppercase">
                    {formatDay(last.date)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(last.portfolio, "USD")}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Portfolio Value"
          data={cardSeries.portfolio.data}
          value={stats.portfolioValue}
          trend={cardSeries.portfolio.trend}
          color="var(--chart-line-primary)"
          gradientId="portfolio-value"
        />
        <StatCard
          title="Net Income"
          data={cardSeries.netIncome.data}
          value={stats.netIncome}
          trend={cardSeries.netIncome.trend}
          color="var(--chart-1)"
          gradientId="portfolio-net-income"
        />
        <StatCard
          title="Gross Income"
          data={cardSeries.grossIncome.data}
          value={stats.grossIncome}
          trend={cardSeries.grossIncome.trend}
          color="var(--success)"
          gradientId="portfolio-gross-income"
        />
        <StatCard
          title="Total Loss"
          data={cardSeries.loss.data}
          value={stats.loss + stats.fees + stats.taxes}
          trend={cardSeries.loss.trend}
          color="var(--destructive)"
          gradientId="portfolio-total-loss"
        />
        <StatCard
          title="USD Cashed Out"
          data={cardSeries.cashOut.data}
          value={stats.cashOut}
          trend={cardSeries.cashOut.trend}
          color="var(--chart-3)"
          gradientId="portfolio-cash-out"
        />
        <StatCard
          title="USD Cashed In"
          data={cardSeries.cashIn.data}
          value={stats.cashIn}
          trend={cardSeries.cashIn.trend}
          color="var(--chart-5)"
          gradientId="portfolio-cash-in"
        />
      </div>

      <GrowthContributors items={contributors} />
    </AppShell>
  )
}
