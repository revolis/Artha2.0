"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { AvgMonthlyIncome } from "@/components/dashboard/avg-monthly-income"
import { CategoryContribution } from "@/components/dashboard/category-contribution"
import { MonthlyStatCard } from "@/components/dashboard/monthly-stat-card"
import { NetPLTrend } from "@/components/dashboard/net-pl-trend"
import { PortfolioCard } from "@/components/dashboard/portfolio-card"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { YearSwitcher } from "@/components/dashboard/year-switcher"
import { EntryFormDialog } from "@/components/entries/entry-form-dialog"
import { GoalCard } from "@/components/goals/goal-card"
import { YearHeatmap } from "@/components/heatmap/year-heatmap"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { Separator } from "@/components/ui/separator"
import {
  getAvgMonthlyIncome,
  getEntryYear,
  mockSettings,
} from "@/lib/mock-data"
import { getMonthlyPerformance } from "@/lib/analytics"
import {
  buildDualDailySeries,
  getMonthOverMonth,
  getPortfolioStats,
} from "@/lib/portfolio"
import { useEntryData } from "@/lib/use-entry-data"
import { useGoals } from "@/lib/use-goals"
import type { Currency, Entry } from "@/lib/types"

const CURRENT_YEAR = new Date().getFullYear()

export function DashboardPage() {
  // Always start on the current year; more years appear as the user adds them.
  const [years, setYears] = React.useState<number[]>([CURRENT_YEAR])
  const [selectedYear, setSelectedYear] = React.useState(CURRENT_YEAR)
  const [currency, setCurrency] = React.useState<Currency>(
    mockSettings.displayCurrency
  )

  function handleSelectYear(year: number) {
    setYears((prev) => (prev.includes(year) ? prev : [...prev, year]))
    setSelectedYear(year)
  }

  const {
    entries,
    setEntries,
    sources,
    categoryOptions,
    tagOptions,
    saveEntry,
  } = useEntryData()
  const [entryDialogOpen, setEntryDialogOpen] = React.useState(false)
  const [editingEntry, setEditingEntry] = React.useState<Entry | null>(null)

  function openCreate() {
    setEditingEntry(null)
    setEntryDialogOpen(true)
  }

  function openEdit(entry: Entry) {
    setEditingEntry(entry)
    setEntryDialogOpen(true)
  }

  function duplicateEntry(entry: Entry) {
    setEntries((prev) => [{ ...entry, id: `e_${Date.now()}` }, ...prev])
  }

  function deleteEntry(entry: Entry) {
    setEntries((prev) => prev.filter((item) => item.id !== entry.id))
  }
  const avgMonthlyIncomeUsd = getAvgMonthlyIncome(entries, selectedYear)
  const { goals } = useGoals()
  const pinnedGoals = goals.filter((goal) => goal.showOnDashboard)

  const series = React.useMemo(
    () => buildDualDailySeries(entries, selectedYear),
    [entries, selectedYear]
  )
  const momentum = React.useMemo(() => getMonthOverMonth(series), [series])
  const stats = React.useMemo(
    () => getPortfolioStats(entries, selectedYear),
    [entries, selectedYear]
  )
  const netLoss = stats.loss + stats.fees + stats.taxes

  // Monthly points for the three stat cards. The current year stops at the
  // present month so the line doesn't fall to zero across months yet to come.
  const monthlyCards = React.useMemo(() => {
    const months = getMonthlyPerformance(entries, selectedYear)
    const lastMonth =
      selectedYear === CURRENT_YEAR ? new Date().getMonth() : 11
    const visible = months.slice(0, lastMonth + 1)

    const seriesFor = (pick: (month: (typeof months)[number]) => number) =>
      visible.map((month) => ({
        date: new Date(selectedYear, month.month, 1),
        value: pick(month),
      }))

    // Percent change between the last two months that had any activity.
    const trendFor = (pick: (month: (typeof months)[number]) => number) => {
      const active = visible.filter((month) => month.count > 0)
      if (active.length < 2) return null
      const latest = pick(active[active.length - 1])
      const previous = pick(active[active.length - 2])
      if (previous === 0) return null
      return ((latest - previous) / Math.abs(previous)) * 100
    }

    return {
      netPL: {
        data: seriesFor((month) => month.net),
        trend: trendFor((month) => month.net),
      },
      income: {
        data: seriesFor((month) => month.income),
        trend: trendFor((month) => month.income),
      },
      expense: {
        data: seriesFor((month) => month.expense),
        trend: trendFor((month) => month.expense),
      },
    }
  }, [entries, selectedYear])
  const yearEntries = React.useMemo(
    () => entries.filter((entry) => getEntryYear(entry) === selectedYear),
    [entries, selectedYear]
  )

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Financial Dashboard
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Financial Dashboard for Year {selectedYear}
          </h1>
        </div>
        <InteractiveHoverButton onClick={openCreate}>
          Add Entry
        </InteractiveHoverButton>
      </div>

      <YearSwitcher
        years={years}
        selectedYear={selectedYear}
        currentYear={CURRENT_YEAR}
        onSelectYear={handleSelectYear}
      />

      <AvgMonthlyIncome
        amountUsd={avgMonthlyIncomeUsd}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      {pinnedGoals.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Goals
            </span>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/goals" />}
              nativeButton={false}
            >
              Manage goals
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pinnedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      ) : null}

      <PortfolioCard
        series={series}
        momentum={momentum}
        netIncome={stats.netIncome}
        cashOut={stats.cashOut}
        cashIn={stats.cashIn}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MonthlyStatCard
          title="Net P/L"
          data={monthlyCards.netPL.data}
          netValue={stats.netIncome}
          trend={monthlyCards.netPL.trend}
          color="var(--chart-1)"
          gradientId="stat-card-net-pl"
        />
        <MonthlyStatCard
          title="Gross Income"
          data={monthlyCards.income.data}
          netValue={stats.grossIncome}
          trend={monthlyCards.income.trend}
          color="var(--success)"
          gradientId="stat-card-gross-income"
        />
        <MonthlyStatCard
          title="Net Loss"
          data={monthlyCards.expense.data}
          netValue={netLoss}
          trend={monthlyCards.expense.trend}
          color="var(--destructive)"
          gradientId="stat-card-net-loss"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <NetPLTrend entries={entries} year={selectedYear} />
        <CategoryContribution entries={entries} year={selectedYear} />
      </div>

      <RecentTransactions
        entries={yearEntries}
        sources={sources}
        onEdit={openEdit}
        onDuplicate={duplicateEntry}
        onDelete={deleteEntry}
      />

      <YearHeatmap entries={entries} sources={sources} year={selectedYear} />

      <Separator />
      {/* Recent entries — added later */}

      <EntryFormDialog
        key={entryDialogOpen ? (editingEntry?.id ?? "create") : "closed"}
        entry={editingEntry}
        open={entryDialogOpen}
        onOpenChange={(open) => {
          setEntryDialogOpen(open)
          if (!open) setEditingEntry(null)
        }}
        sources={sources}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        onSave={saveEntry}
      />
    </AppShell>
  )
}
