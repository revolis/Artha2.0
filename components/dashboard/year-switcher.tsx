"use client"

import * as React from "react"

import { MoreVertical, Plus, Trash2 } from "@/components/icons"
import WheelList, {
  type WheelState,
} from "@/components/lab/inertial-wheel-list"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickedYear, setPickedYear] = React.useState(currentYear)

  // Oldest year first, so past years sit to the left like tabs.
  const sortedYears = [...years].sort((a, b) => a - b)

  // Full pickable range: spin up for previous years, down for upcoming ones.
  // Memoised because the wheel re-emits whenever this array's identity
  // changes, and a fresh array each render would loop.
  const yearOptions = React.useMemo(
    () =>
      Array.from({ length: YEAR_RANGE * 2 + 1 }, (_, i) =>
        String(currentYear - YEAR_RANGE + i)
      ),
    [currentYear]
  )

  // Stable for the same reason; only commit once the spin has settled.
  const handleWheelChange = React.useCallback((state: WheelState) => {
    if (state.settled) setPickedYear(Number(state.value))
  }, [])

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
      {/* A popover rather than a menu: the wheel is a listbox with its own
          scrolling and arrow-key handling, which a menu would fight over. */}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger
          render={<Button size="sm" variant="ghost" className="rounded-full" />}
        >
          <Plus data-icon="inline-start" />
          Add Year
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Spin for past or upcoming years
            </span>

            <WheelList
              items={yearOptions}
              label="Year"
              initialIndex={YEAR_RANGE}
              onStateChange={handleWheelChange}
            />

            <Button
              className="w-full"
              onClick={() => {
                onSelectYear(pickedYear)
                setPickerOpen(false)
              }}
            >
              Add {pickedYear}
              {pickedYear === currentYear ? " · now" : ""}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
