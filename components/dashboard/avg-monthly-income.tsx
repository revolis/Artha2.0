"use client"

import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { convertFromUsd, formatMoney } from "@/lib/mock-data"
import type { Currency } from "@/lib/types"

const currencies: Currency[] = ["USD", "NPR"]

interface AvgMonthlyIncomeProps {
  amountUsd: number
  currency: Currency
  onCurrencyChange: (currency: Currency) => void
}

export function AvgMonthlyIncome({
  amountUsd,
  currency,
  onCurrencyChange,
}: AvgMonthlyIncomeProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
        Avg Monthly Income
      </span>
      <span className="text-sm font-semibold text-primary">
        {formatMoney(convertFromUsd(amountUsd, currency), currency)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Change currency" />
          }
        >
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {currencies.map((item) => (
              <DropdownMenuItem
                key={item}
                onClick={() => onCurrencyChange(item)}
              >
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
