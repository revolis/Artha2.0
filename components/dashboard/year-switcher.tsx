"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const YEAR_RANGE = 15 // how many years back and forward the picker offers

interface YearSwitcherProps {
  years: number[]
  selectedYear: number
  currentYear: number
  onSelectYear: (year: number) => void
}

export function YearSwitcher({
  years,
  selectedYear,
  currentYear,
  onSelectYear,
}: YearSwitcherProps) {
  // Oldest year first, so past years sit to the left like tabs.
  const sortedYears = [...years].sort((a, b) => a - b)

  // Full pickable range: scroll up for previous years, down for upcoming ones.
  const pickableYears = Array.from(
    { length: YEAR_RANGE * 2 + 1 },
    (_, i) => currentYear - YEAR_RANGE + i
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sortedYears.map((year) => (
        <Button
          key={year}
          size="sm"
          variant={year === selectedYear ? "default" : "outline"}
          className="rounded-full"
          onClick={() => onSelectYear(year)}
        >
          {year}
        </Button>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="sm" variant="ghost" className="rounded-full" />}
        >
          <Plus data-icon="inline-start" />
          Add Year
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="px-3 pt-2 text-xs text-muted-foreground">
            Scroll up for past, down for upcoming
          </DropdownMenuLabel>
          <ScrollArea className="h-56">
            <DropdownMenuGroup className="p-1">
              {pickableYears.map((year) => (
                <DropdownMenuItem
                  key={year}
                  className={cn(
                    "justify-center",
                    year === currentYear && "font-semibold text-primary"
                  )}
                  ref={
                    year === currentYear
                      ? (node: HTMLDivElement | null) =>
                          node?.scrollIntoView({ block: "center" })
                      : undefined
                  }
                  onClick={() => onSelectYear(year)}
                >
                  {year}
                  {year === currentYear && (
                    <span className="text-xs text-muted-foreground">
                      · now
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
