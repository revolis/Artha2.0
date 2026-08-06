"use client"

import * as React from "react"

import {
  ACTIVITY_ICONS,
  ActivityStats,
  type ActivityStat,
} from "@/components/analytics/activity-stats"
import { Bar } from "@/components/charts/bar"
import { BarChart } from "@/components/charts/bar-chart"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip"
import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  type TrendPoint,
} from "@/lib/analytics"
import { formatMoney, getEntryYear, getNetAmount } from "@/lib/mock-data"
import { monthBucketsForYear, toStatPoints, trendOf } from "@/lib/stat-series"
import { useSettings } from "@/lib/use-settings"
import { useEntryData } from "@/lib/use-entry-data"
import { useGoals } from "@/lib/use-goals"
import { useProfile } from "@/lib/use-profile"
import type { Entry } from "@/lib/types"
import { cn } from "@/lib/utils"

const INCOME_COLOR = "var(--success)"
const EXPENSE_COLOR = "var(--destructive)"
const NET_COLOR = "var(--chart-line-primary)"

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
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium tabular-nums">{value}</span>
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
    <Card size="sm">
      <CardHeader>
        <CardDescription className="text-[10px] font-medium tracking-[0.16em] uppercase">
          {eyebrow}
        </CardDescription>
        <CardTitle className="text-base">
          {month ? `${month.label} ${year}` : "Not available"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!month ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums",
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
  const { goals } = useGoals()
  const { profile } = useProfile()
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

  // Account activity — spans every year, not just the one selected.
  const activityStats = React.useMemo<ActivityStat[]>(() => {
    const memberSince = new Date(`${profile.createdAt}T00:00:00`)
    return [
      {
        label: "Member since",
        value: new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
        }).format(memberSince),
        sub: "Account opened",
        icon: ACTIVITY_ICONS.memberSince,
      },
      {
        label: "Entries logged",
        value: entries.length,
        sub: "All time",
        icon: ACTIVITY_ICONS.entries,
      },
      {
        label: "Years active",
        value: new Set(entries.map(getEntryYear)).size,
        sub: "With activity",
        icon: ACTIVITY_ICONS.years,
      },
      {
        label: "Sources tracked",
        value: sources.length,
        sub: "Platforms and people",
        icon: ACTIVITY_ICONS.sources,
      },
      {
        label: "Goals set",
        value: goals.length,
        sub: "Targets created",
        icon: ACTIVITY_ICONS.goals,
      },
    ]
  }, [entries, sources, goals, profile.createdAt])

  const months = React.useMemo(
    () => getMonthlyPerformance(entries, year),
    [entries, year]
  )
  // The chart wants plain records; MonthPerformance carries extras the cards
  // use, so the bars get their own narrowed copy.
  const chartMonths = React.useMemo<TrendPoint[]>(
    () =>
      months.map((month) => ({
        label: month.label,
        income: month.income,
        expense: month.expense,
        net: month.net,
      })),
    [months]
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

      <Card size="sm">
        <CardHeader>
          <CardTitle>Monthly performance</CardTitle>
          <CardDescription>
            Income against expense each month, with the net alongside.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {activeMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No profit or loss entries recorded in {year}.
            </p>
          ) : (
            <>
              <BarChart
                data={chartMonths}
                xDataKey="label"
                className="w-full"
                aspectRatio="8 / 3"
                margin={{ top: 16, right: 16, bottom: 32, left: 16 }}
                barGap={0.28}
              >
                <Grid horizontal />
                <Bar dataKey="income" fill={INCOME_COLOR} />
                <Bar dataKey="expense" fill={EXPENSE_COLOR} />
                <Bar dataKey="net" fill={NET_COLOR} />
                <BarXAxis />
                {/* Custom tooltip — every figure formatted as currency. */}
                <ChartTooltip
                  rows={(point) => [
                    {
                      color: INCOME_COLOR,
                      label: "Income",
                      value: formatMoney(Number(point.income), "USD"),
                    },
                    {
                      color: EXPENSE_COLOR,
                      label: "Expense",
                      value: formatMoney(Number(point.expense), "USD"),
                    },
                    {
                      color: NET_COLOR,
                      label: "Net",
                      value: signed(Number(point.net)),
                    },
                  ]}
                />
              </BarChart>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                {[
                  { color: INCOME_COLOR, label: "Income" },
                  { color: EXPENSE_COLOR, label: "Expense" },
                  { color: NET_COLOR, label: "Net" },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-[3px]"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account activity, revealed as you reach it. */}
      <ActivityStats stats={activityStats} />

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
        <Card size="sm">
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

        <Card size="sm">
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

      <Card size="sm">
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

      <Card size="sm">
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
