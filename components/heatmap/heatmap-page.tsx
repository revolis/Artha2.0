"use client"

import * as React from "react"

import { YearHeatmap } from "@/components/heatmap/year-heatmap"
import { AppShell } from "@/components/layout/app-shell"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getEntryYear } from "@/lib/mock-data"
import { useSettings } from "@/lib/use-settings"
import { useEntryData } from "@/lib/use-entry-data"

export function HeatmapPage() {
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

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Year Heatmap
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Year Heatmap
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

      <YearHeatmap entries={entries} sources={sources} year={year} />
    </AppShell>
  )
}
