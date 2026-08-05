"use client"

import { MoreVertical, Plus, Trash2 } from "lucide-react"

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
  onRequestDeleteYear: (year: number) => void
}

export function YearSwitcher({
  years,
  selectedYear,
  currentYear,
  onSelectYear,
  onRequestDeleteYear,
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
      {sortedYears.map((year) => {
        const isSelected = year === selectedYear
        return (
          <div
            key={year}
            className={cn(
              "flex items-center rounded-full border",
              isSelected
                ? "border-transparent bg-primary text-primary-foreground"
                : "bg-background"
            )}
          >
            <button
              type="button"
              onClick={() => onSelectYear(year)}
              className="h-8 rounded-l-full pr-1.5 pl-3 text-sm font-medium"
            >
              {year}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Options for ${year}`}
                    className={cn(
                      "flex h-8 items-center rounded-r-full pr-2 pl-1",
                      isSelected
                        ? "text-primary-foreground/80 hover:text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  />
                }
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onRequestDeleteYear(year)}
                  >
                    <Trash2 />
                    Delete {year}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="sm" variant="ghost" className="rounded-full" />}
        >
          <Plus data-icon="inline-start" />
          Add Year
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <ScrollArea className="h-56">
            {/* The label must live inside the group — Base UI throws if a
                group part is rendered without a Group ancestor. */}
            <DropdownMenuGroup className="p-1">
              <DropdownMenuLabel className="px-3 pt-2 text-xs text-muted-foreground">
                Scroll up for past, down for upcoming
              </DropdownMenuLabel>
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
