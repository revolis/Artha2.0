// Currency conversion and formatting, as pure functions.
//
// Everything these need is passed in. They used to read the display currency,
// the privacy flag and the rate table from mutable module variables, which made
// the output depend on whether some other component had happened to write those
// variables first — a hard load of one page formatted every amount in the
// default currency while the same page reached by a link formatted it
// correctly. Nothing here reads anything it was not given, so that cannot
// happen. Components get a bound copy from `useMoney`.

import type { RateTable } from "@/lib/rate-data"
import type { Currency } from "@/lib/types"

/** What a figure needs to know about the reader to be rendered for them. */
export interface MoneyContext {
  /** Currency the reader has asked to see every amount in. */
  display: Currency
  /** Units per 1 USD, as fetched or seeded. */
  rates: RateTable
  /** When true, every amount is masked rather than shown. */
  privacy: boolean
}

export const PRIVACY_MASK = "••••••"

const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: "en-US",
  NPR: "en-IN",
  INR: "en-IN",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: RateTable
): number {
  if (from === to) return amount
  return (amount / rates[from]) * rates[to]
}

/**
 * Formats an amount for display. `from` is the currency the amount is stored
 * in; the result is converted into the reader's display currency, so one
 * setting changes every figure on the site.
 */
export function formatMoney(
  amount: number,
  from: Currency,
  context: MoneyContext
): string {
  if (context.privacy) return PRIVACY_MASK
  const converted = convertCurrency(
    amount,
    from,
    context.display,
    context.rates
  )
  return new Intl.NumberFormat(CURRENCY_LOCALES[context.display], {
    style: "currency",
    currency: context.display,
    maximumFractionDigits:
      context.display === "NPR" || context.display === "INR" ? 0 : 2,
  }).format(converted)
}

/**
 * Formats a plain number that is not money — a rate, a count — honouring
 * privacy but never converting. A P2P rate is a property of the trade, not an
 * amount held in a currency.
 */
export function formatPlain(
  value: number,
  context: MoneyContext,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }
): string {
  if (context.privacy) return PRIVACY_MASK
  return new Intl.NumberFormat("en-US", options).format(value)
}

/**
 * Formats a cash amount that is genuinely held in another currency — the rupees
 * handed over in a P2P trade. Shown in that currency, not converted, because
 * the number is the physical cash that changed hands.
 */
export function formatCash(
  amount: number,
  currency: string,
  context: MoneyContext
): string {
  if (context.privacy) return PRIVACY_MASK
  return `${currency} ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount)}`
}
