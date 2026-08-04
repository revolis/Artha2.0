"use client"

import * as React from "react"
import { Eye, LogOut, Plus } from "lucide-react"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AvgMonthlyIncome } from "@/components/dashboard/avg-monthly-income"
import { YearSwitcher } from "@/components/dashboard/year-switcher"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Artha Mgmt
            </span>
            <span className="text-sm font-semibold">Financial Overview</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" aria-label="Privacy mode">
              <Eye />
            </Button>
            <Button variant="outline" size="sm">
              <LogOut data-icon="inline-start" />
              Sign Out
            </Button>
          </div>
        </header>
        <div className="flex flex-col gap-6 p-4 md:p-6">
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
