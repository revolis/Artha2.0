"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"

import { AvgMonthlyIncome } from "@/components/dashboard/avg-monthly-income"
import { YearSwitcher } from "@/components/dashboard/year-switcher"
import { EntryFormDialog } from "@/components/entries/entry-form-dialog"
import { GoalCard } from "@/components/goals/goal-card"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getAvgMonthlyIncome, mockSettings } from "@/lib/mock-data"
import { useEntryData } from "@/lib/use-entry-data"
import { useGoals } from "@/lib/use-goals"
import type { Currency } from "@/lib/types"

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

  const { entries, sources, categoryOptions, tagOptions, saveEntry } =
    useEntryData()
  const [entryDialogOpen, setEntryDialogOpen] = React.useState(false)
  const avgMonthlyIncomeUsd = getAvgMonthlyIncome(entries, selectedYear)
  const { goals } = useGoals()
  const pinnedGoals = goals.filter((goal) => goal.showOnDashboard)

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
        <Button onClick={() => setEntryDialogOpen(true)}>
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

      <Separator />
      {/* Portfolio value, P/L cards, charts, heatmap — added later */}

      <EntryFormDialog
        key={entryDialogOpen ? "create" : "closed"}
        entry={null}
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        sources={sources}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        onSave={saveEntry}
      />
    </AppShell>
  )
}
