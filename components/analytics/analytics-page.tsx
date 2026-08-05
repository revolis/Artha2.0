"use client"

import * as React from "react"
import { Bar, BarChart, Cell, CartesianGrid, XAxis, YAxis } from "recharts"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
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
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { entryTypeLabels } from "@/components/entries/entry-form-dialog"
import { StatCard } from "@/components/stats/stat-card"
import {
  getMonthExtremes,
  getMonthlyPerformance,
  getPerformanceBreakdown,
  getTopTransactions,
  getWeekdayPerformance,
  getYearTotals,
  isExpense,
  isIncome,
  type MonthPerformance,
  type PerformanceRow,
} from "@/lib/analytics"
import { formatMoney, getEntryYear, getNetAmount } from "@/lib/mock-data"
import { monthBucketsForYear, toStatPoints, trendOf } from "@/lib/stat-series"
import { useSettings } from "@/lib/use-settings"
import { useEntryData } from "@/lib/use-entry-data"
import type { Entry } from "@/lib/types"
import { cn } from "@/lib/utils"

const chartConfig = {
  net: { label: "Net" },
} satisfies ChartConfig

function signed(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatMoney(Math.abs(value), "USD")}`
}

function toneFor(value: number): string | undefined {
  if (value > 0) return "text-success"
  if (value < 0) return "text-destructive"
  return undefined
}

function formatDate(datetime: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(datetime))
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}

function MonthCard({
  eyebrow,
  month,
  year,
  emptyText,
}: {
  eyebrow: string
  month: MonthPerformance | null
  year: number
  emptyText: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-medium tracking-wider uppercase">
          {eyebrow}
        </CardDescription>
        <CardTitle className="text-lg">
          {month ? `${month.label} ${year}` : "Not available"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!month ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <span
              className={cn(
                "text-3xl font-semibold tabular-nums",
                toneFor(month.net)
              )}
            >
              {signed(month.net)}
            </span>
            <Separator />
            <div className="flex flex-col divide-y">
              <DetailRow
                label="Income"
                value={formatMoney(month.income, "USD")}
              />
              <DetailRow
                label="Expense"
                value={formatMoney(month.expense, "USD")}
              />
              <DetailRow label="Entries" value={month.count} />
              <DetailRow label="Active days" value={month.activeDays} />
              <DetailRow
                label="Leading category"
                value={month.topCategory ?? "—"}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TransactionTable({
  entries,
  sourceById,
  showType,
  emptyText,
}: {
  entries: Entry[]
  sourceById: Map<string, string>
  showType?: boolean
  emptyText: string
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showType ? <TableHead>Type</TableHead> : null}
            <TableHead>Category</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap">
                {formatDate(entry.datetime)}
              </TableCell>
              {showType ? (
                <TableCell>
                  <Badge variant="secondary">
                    {entryTypeLabels[entry.type]}
                  </Badge>
                </TableCell>
              ) : null}
              <TableCell>{entry.category ?? "—"}</TableCell>
              <TableCell>
                {entry.sourceId ? (sourceById.get(entry.sourceId) ?? "—") : "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium tabular-nums",
                  showType ? "text-destructive" : "text-success"
                )}
              >
                {showType ? "−" : "+"}
                {formatMoney(entry.amount, "USD")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function BreakdownTable({
  rows,
  label,
  emptyText,
}: {
  rows: PerformanceRow[]
  label: string
  emptyText: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{label}</TableHead>
            <TableHead className="text-right">Entries</TableHead>
            <TableHead className="text-right">Income</TableHead>
            <TableHead className="text-right">Expense</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead className="text-right">Win rate</TableHead>
            <TableHead className="w-40">Share of income</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.count}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(row.income, "USD")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(row.expense, "USD")}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium tabular-nums",
                  toneFor(row.net)
                )}
              >
                {signed(row.net)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.winRate !== null ? `${row.winRate.toFixed(0)}%` : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={row.share} className="flex-1" />
                  <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                    {row.share.toFixed(0)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function AnalyticsPage() {
  // Subscribing re-renders every amount when the display currency changes.
  useSettings()
  const { entries, sources } = useEntryData()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = React.useState(currentYear)

  const yearItems = React.useMemo(() => {
    const years = new Set(entries.map(getEntryYear))
    years.add(currentYear)
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((value) => ({ value: String(value), label: String(value) }))
  }, [entries, currentYear])

  const sourceById = React.useMemo(
    () => new Map(sources.map((source) => [source.id, source.name])),
    [sources]
  )

  const months = React.useMemo(
    () => getMonthlyPerformance(entries, year),
    [entries, year]
  )
  const { best, lowest } = React.useMemo(
    () => getMonthExtremes(months),
    [months]
  )
  const totals = React.useMemo(() => getYearTotals(months), [months])
  const topIncome = React.useMemo(
    () => getTopTransactions(entries, year, "income"),
    [entries, year]
  )
  const topExpense = React.useMemo(
    () => getTopTransactions(entries, year, "expense"),
    [entries, year]
  )
  const sourceRows = React.useMemo(
    () =>
      getPerformanceBreakdown(entries, year, (entry) =>
        entry.sourceId ? sourceById.get(entry.sourceId) : undefined
      ),
    [entries, year, sourceById]
  )
  const categoryRows = React.useMemo(
    () => getPerformanceBreakdown(entries, year, (entry) => entry.category),
    [entries, year]
  )
  const weekdays = React.useMemo(
    () => getWeekdayPerformance(entries, year),
    [entries, year]
  )

  // Monthly points behind each headline card.
  const cardSeries = React.useMemo(() => {
    const buckets = monthBucketsForYear(entries, year)
    const sum = (pick: (entry: Entry) => number) => (rows: Entry[]) =>
      rows.reduce((total, entry) => total + pick(entry), 0)

    const net = toStatPoints(buckets, sum(getNetAmount))
    const income = toStatPoints(
      buckets,
      sum((entry) => (isIncome(entry) ? entry.amount : 0))
    )
    const expense = toStatPoints(
      buckets,
      sum((entry) => (isExpense(entry) ? entry.amount : 0))
    )

    return {
      net: { data: net, trend: trendOf(net) },
      income: { data: income, trend: trendOf(income) },
      expense: { data: expense, trend: trendOf(expense) },
    }
  }, [entries, year])

  const activeMonths = months.filter((month) => month.count > 0)
  const maxWeekdayNet = Math.max(1, ...weekdays.map((day) => Math.abs(day.net)))
  const bestWeekday = [...weekdays].sort((a, b) => b.net - a.net)[0]

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Analytics
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Performance Analytics
          </h1>
        </div>
        <Select
          items={yearItems}
          value={String(year)}
          onValueChange={(value) => setYear(Number(value))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {yearItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Net Result"
          data={cardSeries.net.data}
          value={totals.net}
          trend={cardSeries.net.trend}
          color="var(--chart-1)"
          gradientId="analytics-net-result"
        />
        <StatCard
          title="Total Income"
          data={cardSeries.income.data}
          value={totals.income}
          trend={cardSeries.income.trend}
          color="var(--success)"
          gradientId="analytics-total-income"
        />
        <StatCard
          title="Total Expense"
          data={cardSeries.expense.data}
          value={totals.expense}
          trend={cardSeries.expense.trend}
          color="var(--destructive)"
          gradientId="analytics-total-expense"
        />
        <StatCard
          title="Monthly Average"
          data={cardSeries.net.data}
          value={totals.monthlyAverage}
          restLabel="Avg"
          trend={cardSeries.net.trend}
          color="var(--chart-4)"
          gradientId="analytics-monthly-average"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly performance</CardTitle>
          <CardDescription>
            Net result per month. Bars above the line are profitable months.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No profit or loss entries recorded in {year}.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={months} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(value: number) =>
                    formatMoney(value, "USD").replace(".00", "")
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => signed(Number(value))}
                    />
                  }
                />
                {/* Animation left on leaves the bars unrendered here. */}
                <Bar dataKey="net" radius={6} isAnimationActive={false}>
                  {months.map((month) => (
                    <Cell
                      key={month.label}
                      fill={
                        month.net >= 0 ? "var(--success)" : "var(--destructive)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthCard
          eyebrow="Best performing month"
          month={best}
          year={year}
          emptyText={`No activity recorded in ${year}.`}
        />
        <MonthCard
          eyebrow="Lowest performing month"
          month={lowest}
          year={year}
          emptyText="At least two active months are needed to compare."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top income transactions</CardTitle>
            <CardDescription>
              Your five largest single profits in {year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionTable
              entries={topIncome}
              sourceById={sourceById}
              emptyText={`No profit entries recorded in ${year}.`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top expense transactions</CardTitle>
            <CardDescription>
              Your five largest losses, fees and taxes in {year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionTable
              entries={topExpense}
              sourceById={sourceById}
              showType
              emptyText={`No losses, fees or taxes recorded in ${year}.`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform and source performance</CardTitle>
          <CardDescription>
            How each platform and category contributed in {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sources" className="flex flex-col gap-4">
            <TabsList>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            <TabsContent value="sources">
              <BreakdownTable
                rows={sourceRows}
                label="Source"
                emptyText={`No entries with a source in ${year}.`}
              />
            </TabsContent>
            <TabsContent value="categories">
              <BreakdownTable
                rows={categoryRows}
                label="Category"
                emptyText={`No categorised entries in ${year}.`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timing patterns</CardTitle>
          <CardDescription>
            {bestWeekday && bestWeekday.net > 0
              ? `${bestWeekday.label} has been your strongest day of the week.`
              : `Which weekdays your entries land on in ${year}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="w-48">Relative size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekdays.map((day) => (
                  <TableRow key={day.label}>
                    <TableCell className="font-medium">{day.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {day.count}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        toneFor(day.net)
                      )}
                    >
                      {day.count > 0 ? signed(day.net) : "—"}
                    </TableCell>
                    <TableCell>
                      <Progress
                        value={(Math.abs(day.net) / maxWeekdayNet) * 100}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  )
}
