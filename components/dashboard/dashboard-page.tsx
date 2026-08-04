"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { AvgMonthlyIncome } from "@/components/dashboard/avg-monthly-income"
import { YearSwitcher } from "@/components/dashboard/year-switcher"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getAvgMonthlyIncome, mockSettings } from "@/lib/mock-data"
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

  const avgMonthlyIncomeUsd = getAvgMonthlyIncome(selectedYear)

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
        <Button>
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

      <Separator />
      {/* Goals card, portfolio value, P/L cards, charts, heatmap — added later */}
    </AppShell>
  )
}
