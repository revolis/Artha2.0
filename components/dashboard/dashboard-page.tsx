"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "@/components/icons"

import { AvgMonthlyIncome } from "@/components/dashboard/avg-monthly-income"
import { CategoryContribution } from "@/components/dashboard/category-contribution"
import { DeleteYearDialog } from "@/components/dashboard/delete-year-dialog"
import { StatCard } from "@/components/stats/stat-card"
import { NetPLTrend } from "@/components/dashboard/net-pl-trend"
import { PortfolioCard } from "@/components/dashboard/portfolio-card"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { CurrencyConverter } from "@/components/currency/currency-converter"
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
  getNetAmount,
} from "@/lib/mock-data"
import { goalCoversYear } from "@/lib/goals"
import { useSettings } from "@/lib/use-settings"
import {
  buildDualDailySeries,
  getMonthOverMonth,
  getPortfolioStats,
} from "@/lib/portfolio"
import { monthBucketsForYear, toStatPoints, trendOf } from "@/lib/stat-series"
import { newId } from "@/lib/id"
import { useEntryData } from "@/lib/use-entry-data"
import { useGoals } from "@/lib/use-goals"
import { useDashboardYears } from "@/lib/use-years"
import type { Entry } from "@/lib/types"
import { cn } from "@/lib/utils"

const CURRENT_YEAR = new Date().getFullYear()

export function DashboardPage() {
  const [selectedYear, setSelectedYear] = React.useState(CURRENT_YEAR)
  // Subscribing re-renders every amount when the display currency changes.
  useSettings()

  const [yearPendingDelete, setYearPendingDelete] = React.useState<
    number | null
  >(null)

  const {
    entries,
    setEntries,
    sources,
    categoryOptions,
    tagOptions,
    saveEntry,
  } = useEntryData()

  // Tabs for this year, every year holding entries, and anything opened by
  // hand — the last of those is saved, so the tabs come back after a reload.
  const { years, addYear, forgetYear } = useDashboardYears(
    entries,
    CURRENT_YEAR
  )

  function handleSelectYear(year: number) {
    addYear(year)
    setSelectedYear(year)
  }

  // Removes the year's entries as well as the tab — that data loss is what the
  // export prompt and hold-to-confirm in the dialog are guarding.
  function handleDeleteYear(year: number) {
    setEntries((prev) => prev.filter((entry) => getEntryYear(entry) !== year))
    forgetYear(year)
    if (selectedYear === year) {
      const remaining = years.filter((item) => item !== year)
      setSelectedYear(
        remaining.length > 0 ? Math.max(...remaining) : CURRENT_YEAR
      )
    }
  }
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
    setEntries((prev) => [{ ...entry, id: newId() }, ...prev])
  }

  function deleteEntry(entry: Entry) {
    setEntries((prev) => prev.filter((item) => item.id !== entry.id))
  }
  const avgMonthlyIncomeUsd = getAvgMonthlyIncome(entries, selectedYear)
  const { goals } = useGoals()
  // Pinned goals belonging to the year on screen. Without the year check the
  // same cards followed you from tab to tab, whichever year you were looking at.
  const pinnedGoals = goals.filter(
    (goal) => goal.showOnDashboard && goalCoversYear(goal, selectedYear)
  )

  const series = React.useMemo(
    () => buildDualDailySeries(entries, selectedYear),
    [entries, selectedYear]
  )
  const momentum = React.useMemo(() => getMonthOverMonth(series), [series])
  // The same comparison for the figure before cash moved in or out.
  const grossMomentum = React.useMemo(
    () => getMonthOverMonth(series, "netIncome"),
    [series]
  )
  const stats = React.useMemo(
    () => getPortfolioStats(entries, selectedYear),
    [entries, selectedYear]
  )
  const netLoss = stats.loss + stats.fees + stats.taxes

  // Monthly points for the three stat cards. The current year stops at the
  // present month so the line doesn't fall to zero across months yet to come.
  const monthlyCards = React.useMemo(() => {
    const buckets = monthBucketsForYear(entries, selectedYear)
    const sum = (pick: (entry: Entry) => number) => (rows: Entry[]) =>
      rows.reduce((total, entry) => total + pick(entry), 0)

    const netPL = toStatPoints(buckets, sum(getNetAmount))
    const income = toStatPoints(
      buckets,
      sum((entry) => (entry.type === "profit" ? entry.amount : 0))
    )
    const expense = toStatPoints(
      buckets,
      sum((entry) =>
        entry.type === "loss" || entry.type === "fee" || entry.type === "tax"
          ? entry.amount
          : 0
      )
    )

    return {
      netPL: { data: netPL, trend: trendOf(netPL) },
      income: { data: income, trend: trendOf(income) },
      expense: { data: expense, trend: trendOf(expense) },
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
        onRequestDeleteYear={setYearPendingDelete}
      />

      <AvgMonthlyIncome amountUsd={avgMonthlyIncomeUsd} />

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
          {/* One or two pinned goals sit centred rather than stranded on the
              left; three or more fill the row as a normal grid. The max widths
              keep the card roughly the same size whichever way it lands. */}
          <div
            className={cn(
              "grid gap-4",
              pinnedGoals.length === 1 && "mx-auto w-full max-w-xs",
              pinnedGoals.length === 2 &&
                "mx-auto w-full max-w-2xl sm:grid-cols-2",
              pinnedGoals.length >= 3 && "md:grid-cols-2 xl:grid-cols-3"
            )}
          >
            {pinnedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      ) : null}

      <PortfolioCard
        series={series}
        momentum={momentum}
        grossMomentum={grossMomentum}
        netIncome={stats.netIncome}
        cashOut={stats.cashOut}
        cashIn={stats.cashIn}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Net P/L"
          data={monthlyCards.netPL.data}
          value={stats.netIncome}
          trend={monthlyCards.netPL.trend}
          color="var(--chart-1)"
          gradientId="stat-card-net-pl"
        />
        <StatCard
          title="Gross Income"
          data={monthlyCards.income.data}
          value={stats.grossIncome}
          trend={monthlyCards.income.trend}
          color="var(--success)"
          gradientId="stat-card-gross-income"
        />
        <StatCard
          title="Net Loss"
          data={monthlyCards.expense.data}
          value={netLoss}
          trend={monthlyCards.expense.trend}
          color="var(--destructive)"
          gradientId="stat-card-net-loss"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <NetPLTrend entries={entries} year={selectedYear} />
        <CategoryContribution entries={entries} year={selectedYear} />
      </div>

      <CurrencyConverter />

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

      <DeleteYearDialog
        year={yearPendingDelete}
        entryCount={
          yearPendingDelete === null
            ? 0
            : entries.filter(
                (entry) => getEntryYear(entry) === yearPendingDelete
              ).length
        }
        open={yearPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setYearPendingDelete(null)
        }}
        onConfirm={handleDeleteYear}
      />

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
