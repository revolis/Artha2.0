"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  Info,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatMoney } from "@/lib/mock-data"
import {
  buildDailySeries,
  getContributors,
  getPortfolioInsights,
  getPortfolioStats,
  type Contributor,
} from "@/lib/portfolio"
import { useEntryData } from "@/lib/use-entry-data"
import { cn } from "@/lib/utils"

type Preset = "7d" | "30d" | "90d" | "ytd" | "custom"

const presets: { value: Preset; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "ytd", label: "YTD" },
  { value: "custom", label: "Customise" },
]

const chartConfig = {
  value: { label: "Portfolio", color: "var(--success)" },
} satisfies ChartConfig

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`))
}

function ContributorList({
  title,
  description,
  items,
  emptyText,
}: {
  title: string
  description: string
  items: Contributor[]
  emptyText: string
}) {
  const maxNet = Math.max(1, ...items.map((item) => Math.abs(item.net)))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          items.slice(0, 6).map((item, index) => (
            <div key={item.name} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge variant={index === 0 ? "default" : "secondary"}>
                  #{index + 1}
                </Badge>
                <span className="truncate text-sm font-medium">
                  {item.name}
                </span>
                <span
                  className={cn(
                    "ml-auto text-sm font-medium tabular-nums",
                    item.net > 0 && "text-success",
                    item.net < 0 && "text-destructive"
                  )}
                >
                  {item.net >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(item.net), "USD")}
                </span>
              </div>
              <Progress value={(Math.abs(item.net) / maxNet) * 100} />
              <span className="text-xs text-muted-foreground">
                {item.count} {item.count === 1 ? "entry" : "entries"}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function PortfolioPage() {
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
    () => buildDailySeries(entries, year),
    [entries, year]
  )

  const series = React.useMemo(() => {
    if (preset === "ytd") return fullSeries
    if (preset === "custom") {
      return fullSeries.filter(
        (point) =>
          (!customFrom || point.date >= customFrom) &&
          (!customTo || point.date <= customTo)
      )
    }
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90
    return fullSeries.slice(-days)
  }, [fullSeries, preset, customFrom, customTo])

  const stats = React.useMemo(
    () => getPortfolioStats(entries, year),
    [entries, year]
  )
  const categories = React.useMemo(
    () => getContributors(entries, year, (entry) => entry.category),
    [entries, year]
  )
  const sourceRanks = React.useMemo(
    () =>
      getContributors(entries, year, (entry) =>
        entry.sourceId ? sourceById.get(entry.sourceId) : undefined
      ),
    [entries, year, sourceById]
  )
  const insights = React.useMemo(
    () =>
      getPortfolioInsights(entries, year, sourceRanks[0], stats.grossIncome),
    [entries, year, sourceRanks, stats.grossIncome]
  )

  const first = series[0]
  const last = series[series.length - 1]
  const change = first && last ? last.value - first.value : 0
  const percent =
    first && Math.abs(first.value) > 0.01
      ? (change / Math.abs(first.value)) * 100
      : null
  const rangeLabel =
    presets.find((p) => p.value === preset)?.label ?? "Range"

  const summary = [
    {
      label: "Portfolio Value",
      value: formatMoney(stats.portfolioValue, "USD"),
      sub: "Net income − cash out + cash in",
      icon: Wallet,
      tone: stats.portfolioValue >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: "Net Income",
      value: formatMoney(stats.netIncome, "USD"),
      sub: "After loss, fees and tax",
      icon: TrendingUp,
      tone: stats.netIncome >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: "Gross Income",
      value: formatMoney(stats.grossIncome, "USD"),
      sub: `${insights.wins} profit entries`,
      icon: Trophy,
    },
    {
      label: "Total Loss",
      value: formatMoney(stats.loss + stats.fees + stats.taxes, "USD"),
      sub: `Loss ${formatMoney(stats.loss, "USD")} · Fees ${formatMoney(stats.fees, "USD")} · Tax ${formatMoney(stats.taxes, "USD")}`,
      icon: TrendingDown,
      tone: stats.loss + stats.fees + stats.taxes > 0 ? "text-destructive" : undefined,
    },
    {
      label: "USD Cashed Out",
      value: formatMoney(stats.cashOut, "USD"),
      sub: "Sold to fiat via P2P",
      icon: ArrowUpRight,
    },
    {
      label: "USD Cashed In",
      value: formatMoney(stats.cashIn, "USD"),
      sub: "Bought with fiat via P2P",
      icon: ArrowDownLeft,
    },
  ]

  const momentumDelta = insights.thisMonthNet - insights.lastMonthNet

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Portfolio
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Portfolio for {year}
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
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Assets Analysis
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
          </CardTitle>
          <CardDescription>{rangeLabel} Change</CardDescription>
          <div className="flex flex-col gap-0.5">
            <span
              className={cn(
                "text-3xl font-semibold tabular-nums",
                change >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {change >= 0 ? "+" : "−"}
              {formatMoney(Math.abs(change), "USD")}
            </span>
            {percent !== null ? (
              <span
                className={cn(
                  "text-sm font-medium tabular-nums",
                  change >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {change >= 0 ? "+" : ""}
                {percent.toFixed(2)}%
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Started the range at zero
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <AreaChart data={series} margin={{ left: 4, right: 4 }}>
                  <defs>
                    <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-value)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical horizontal={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={40}
                    tickFormatter={(value: string) =>
                      new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(`${value}T00:00:00`))
                    }
                  />
                  <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => formatDay(String(value))}
                        formatter={(value) => formatMoney(Number(value), "USD")}
                      />
                    }
                  />
                  <Area
                    dataKey="value"
                    type="stepAfter"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    fill="url(#fillValue)"
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
              <div className="flex items-end justify-between gap-4 text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">
                    {formatDay(first.date)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(first.value, "USD")}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground">
                    {formatDay(last.date)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(last.value, "USD")}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className={cn("text-2xl tabular-nums", item.tone)}>
                {item.value}
              </CardTitle>
              <CardAction>
                <item.icon className="size-4 text-muted-foreground" />
              </CardAction>
              <CardDescription className="text-xs">{item.sub}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContributorList
          title="Top categories"
          description="Ranked by net contribution this year"
          items={categories}
          emptyText="No categorised entries yet."
        />
        <ContributorList
          title="Top sources"
          description="Ranked by net contribution this year"
          items={sourceRanks}
          emptyText="No entries with a source yet."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>
            Patterns worth knowing about your {year}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="size-3.5" />
              Win rate
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {insights.winRate !== null
                ? `${insights.winRate.toFixed(0)}%`
                : "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {insights.wins} wins · {insights.losses} losses
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" />
              Best day
            </span>
            <span className="text-xl font-semibold tabular-nums text-success">
              {insights.bestDay
                ? formatMoney(insights.bestDay.value, "USD")
                : "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {insights.bestDay ? formatDay(insights.bestDay.date) : "No profit days yet"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingDown className="size-3.5" />
              Worst day
            </span>
            <span className="text-xl font-semibold tabular-nums text-destructive">
              {insights.worstDay
                ? formatMoney(insights.worstDay.value, "USD")
                : "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {insights.worstDay
                ? formatDay(insights.worstDay.date)
                : "No losing days yet"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="size-3.5" />
              Average win
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {formatMoney(insights.avgWin, "USD")}
            </span>
            <span className="text-xs text-muted-foreground">
              Per profit entry
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarCheck className="size-3.5" />
              Active days
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {insights.activeDays}
            </span>
            <span className="text-xs text-muted-foreground">
              Days with at least one entry
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="size-3.5" />
              Month momentum
            </span>
            <span
              className={cn(
                "text-xl font-semibold tabular-nums",
                momentumDelta > 0 && "text-success",
                momentumDelta < 0 && "text-destructive"
              )}
            >
              {momentumDelta >= 0 ? "+" : "−"}
              {formatMoney(Math.abs(momentumDelta), "USD")}
            </span>
            <span className="text-xs text-muted-foreground">
              This month {formatMoney(insights.thisMonthNet, "USD")} vs last{" "}
              {formatMoney(insights.lastMonthNet, "USD")}
            </span>
          </div>

          {insights.concentration !== null ? (
            <div className="flex flex-col gap-1 sm:col-span-2 xl:col-span-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3.5" />
                Source concentration
              </span>
              <span className="text-sm">
                <span className="font-medium">{insights.topSourceName}</span>{" "}
                brings in{" "}
                <span className="font-medium">
                  {insights.concentration.toFixed(0)}%
                </span>{" "}
                of your gross income.
                {insights.concentration > 50
                  ? " That's a lot riding on one source — worth spreading out."
                  : " Reasonably spread across sources."}
              </span>
              <Progress value={insights.concentration} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  )
}
