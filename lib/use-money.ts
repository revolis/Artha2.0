"use client"

// The one way a component gets hold of a money formatter.
//
// Calling this subscribes the component to both the settings store and the
// rate store, so changing the display currency, toggling privacy, or fetching
// new rates re-renders every figure on screen. That subscription is the point:
// the previous arrangement wrote the currency into a module variable and hoped
// each component had already re-rendered, which is not something React
// guarantees.

import * as React from "react"

import {
  convertCurrency,
  formatCash,
  formatMoney,
  formatPlain,
  type MoneyContext,
} from "@/lib/money"
import type { Currency } from "@/lib/types"
import { useRates } from "@/lib/use-rates"
import { useSettings } from "@/lib/use-settings"

export function useMoney() {
  const { settings } = useSettings()
  const { rates } = useRates()

  const display = settings.displayCurrency
  const privacy = settings.privacyMode

  return React.useMemo(() => {
    const context: MoneyContext = { display, rates, privacy }
    return {
      /** Format an amount stored in `from` (USD unless stated) for the reader. */
      formatMoney: (amount: number, from: Currency = "USD") =>
        formatMoney(amount, from, context),
      /** Format cash genuinely held in another currency — not converted. */
      formatCash: (amount: number, currency: string) =>
        formatCash(amount, currency, context),
      /** Format a rate or a count — masked under privacy, never converted. */
      formatPlain: (value: number, options?: Intl.NumberFormatOptions) =>
        formatPlain(value, context, options),
      /** Convert without formatting, for charts and gauges. */
      convert: (amount: number, from: Currency, to: Currency = display) =>
        convertCurrency(amount, from, to, rates),
      displayCurrency: display,
      privacyMode: privacy,
      rates,
      context,
    }
  }, [display, privacy, rates])
}

export type Money = ReturnType<typeof useMoney>
