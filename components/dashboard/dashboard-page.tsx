"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"

import { AvgMonthlyIncome } from "@/components/dashboard/avg-monthly-income"
import { CategoryContribution } from "@/components/dashboard/category-contribution"
import { NetPLTrend } from "@/components/dashboard/net-pl-trend"
import { PortfolioCard } from "@/components/dashboard/portfolio-card"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { YearSwitcher } from "@/components/dashboard/year-switcher"
import { EntryFormDialog } from "@/components/entries/entry-form-dialog"
import { GoalCard } from "@/components/goals/goal-card"
import { YearHeatmap } from "@/components/heatmap/year-heatmap"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  formatMoney,
  getAvgMonthlyIncome,
  getEntryYear,
  mockSettings,
} from "@/lib/mock-data"
import {
  buildDailySeries,
  getMonthOverMonth,
  getPortfolioStats,
} from "@/lib/portfolio"
import { useEntryData } from "@/lib/use-entry-data"
import { useGoals } from "@/lib/use-goals"
import type { Currency, Entry } from "@/lib/types"
import { cn } from "@/lib/utils"

const CURRENT_YEAR = new Date().getFullYear()

function signed(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatMoney(Math.abs(value), "USD")}`
}

// Compact figure card used for the Net P/L, Gross Income and Net Loss row.
function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone?: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <span className={cn("text-2xl font-semibold tabular-nums", tone)}>
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </CardContent>
    </Card>
  )
}

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
    () => buildDailySeries(entries, selectedYear),
    [entries, selectedYear]
  )
  const momentum = React.useMemo(() => getMonthOverMonth(series), [series])
  const stats = React.useMemo(
    () => getPortfolioStats(entries, selectedYear),
    [entries, selectedYear]
  )
  const netLoss = stats.loss + stats.fees + stats.taxes
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
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Add Entry
        </Button>
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

      <PortfolioCard series={series} momentum={momentum} />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Net P/L"
          value={signed(stats.netIncome)}
          sub="Income after loss, fees and tax"
          tone={
            stats.netIncome > 0
              ? "text-success"
              : stats.netIncome < 0
                ? "text-destructive"
                : undefined
          }
        />
        <SummaryCard
          label="Gross Income"
          value={formatMoney(stats.grossIncome, "USD")}
          sub="Everything earned before deductions"
          tone="text-success"
        />
        <SummaryCard
          label="Net Loss"
          value={formatMoney(netLoss, "USD")}
          sub={`Loss ${formatMoney(stats.loss, "USD")} · Fees ${formatMoney(stats.fees, "USD")} · Tax ${formatMoney(stats.taxes, "USD")}`}
          tone={netLoss > 0 ? "text-destructive" : undefined}
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
