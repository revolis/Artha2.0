"use client"

import { Check, ChevronDown } from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatMoney } from "@/lib/mock-data"
import { CURRENCY_OPTIONS, useSettings } from "@/lib/use-settings"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"

export function AvgMonthlyIncome({ amountUsd }: { amountUsd: number }) {
  // Picking a currency here changes the site-wide display currency, so this
  // stays in step with the same setting on the Settings page.
  const { settings, updateSettings } = useSettings()

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
        Avg Monthly Income
      </span>
      <span className="text-sm font-semibold text-primary">
        {formatMoney(amountUsd, "USD")}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Change currency"
            />
          }
        >
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {CURRENCY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() =>
                  updateSettings({ displayCurrency: option.value as Currency })
                }
              >
                <Check
                  className={cn(
                    option.value !== settings.displayCurrency && "invisible"
                  )}
                />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
