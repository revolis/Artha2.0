"use client"

import * as React from "react"
import { ArrowUpDown, Check, Pencil, RefreshCw } from "@/components/icons"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CURRENCY_SYMBOLS } from "@/lib/rate-data"
import {
  CURRENCY_NAMES,
  formatAmountNumber,
  formatDate,
  formatRateNumber,
} from "@/lib/rates"
import type { Currency } from "@/lib/types"
import { daysSince, rateFor, useRates } from "@/lib/use-rates"
import { useSettings } from "@/lib/use-settings"
import { cn } from "@/lib/utils"

const CURRENCIES: Currency[] = ["USD", "NPR", "INR", "EUR", "GBP", "AED"]

const currencyItems = CURRENCIES.map((code) => ({
  value: code,
  label: `${CURRENCY_SYMBOLS[code]}  ${code} — ${CURRENCY_NAMES[code]}`,
}))

function CurrencyField({
  id,
  label,
  value,
  onValueChange,
  amount,
  onAmountChange,
  readOnly,
}: {
  id: string
  label: string
  value: Currency
  onValueChange: (code: Currency) => void
  amount: string
  onAmountChange?: (value: string) => void
  readOnly?: boolean
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border bg-background focus-within:ring-2 focus-within:ring-ring">
      <span
        aria-hidden
        className="flex w-9 shrink-0 items-center justify-center text-sm text-muted-foreground"
      >
        {CURRENCY_SYMBOLS[value]}
      </span>
      <Input
        id={id}
        aria-label={label}
        inputMode="decimal"
        value={amount}
        readOnly={readOnly}
        onChange={(event) => onAmountChange?.(event.target.value)}
        className={cn(
          "h-12 flex-1 rounded-none border-0 bg-transparent px-0 text-base tabular-nums shadow-none focus-visible:ring-0",
          readOnly && "font-semibold"
        )}
      />
      <div aria-hidden className="my-2 w-px bg-border" />
      <Select
        items={currencyItems}
        value={value}
        onValueChange={(next) => onValueChange(next as Currency)}
      >
        <SelectTrigger
          aria-label={`${label} currency`}
          className="h-12 w-24 shrink-0 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        >
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {currencyItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * How long ago the rates were last looked at, in words.
 *
 * The card used to carry an Update button. Rates are fetched by a scheduled
 * job every day now, so pressing it did nothing a person needed doing — and a
 * button that exists only to be redundant invites the worry that without it
 * nothing would happen. What actually reassures is evidence, so the button is
 * gone and the evidence is in its place.
 */
function timeAgo(iso: string, now = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000)
  if (minutes < 2) return "just now"
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`
  const days = Math.round(hours / 24)
  return days === 1 ? "yesterday" : `${days} days ago`
}

/**
 * A full timestamp — "10 Aug 2026 — 3:06 PM" — in the reader's own preference.
 *
 * Not lib/rates' formatDate, which takes a plain calendar date and appends a
 * midnight of its own; handed a real timestamp it produces Invalid Date.
 *
 * Settings has offered a 12h/24h choice since the design phase and nothing has
 * ever read it, so the control saved a value that changed nothing. This is the
 * first thing to honour it.
 */
function formatStamp(iso: string, timeFormat: "12h" | "24h"): string {
  const when = new Date(iso)
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(when)
  const time =
    timeFormat === "24h"
      ? new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(when)
      : new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(when)
  return `${date} — ${time}`
}

function RateFreshness({ checkedAt }: { checkedAt: string | null }) {
  // Re-rendered on a slow timer so "3 minutes ago" does not sit there
  // claiming to be true an hour later.
  const [, tick] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!checkedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
        <RefreshCw className="size-3.5" />
        Updates daily
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground"
      // The exact moment, for anyone who wants to be sure.
      title={new Date(checkedAt).toLocaleString()}
    >
      <Check className="size-3.5 text-success" />
      Checked {timeAgo(checkedAt)}
    </span>
  )
}

/**
 * Converts between two currencies at the live mid-market rate, or at a rate
 * the user types in for a one-off deal. Updating fetches today's rates and
 * applies them to every amount on the site.
 */
export function CurrencyConverter({ className }: { className?: string }) {
  const { rates, updatedAt, source, checkedAt } = useRates()
  const { settings } = useSettings()

  const [from, setFrom] = React.useState<Currency>("USD")
  const [to, setTo] = React.useState<Currency>("NPR")
  const [amount, setAmount] = React.useState("1")
  const [useCustomRate, setUseCustomRate] = React.useState(false)
  const [customRate, setCustomRate] = React.useState("")

  const liveRate = rateFor(rates, from, to)
  const parsedCustom = Number(customRate)
  const customValid = useCustomRate && parsedCustom > 0
  const rate = customValid ? parsedCustom : liveRate

  const parsedAmount = Number(amount.replace(/,/g, ""))
  const converted = Number.isFinite(parsedAmount) ? parsedAmount * rate : 0

  const age = daysSince(updatedAt)

  function swap() {
    setFrom(to)
    setTo(from)
    // An inverted rate is what you'd want next, not the same number.
    if (customValid) {
      setCustomRate(String(Number((1 / parsedCustom).toFixed(6))))
    }
  }

  const samePair = from === to

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Fiat Currency</CardTitle>
            {/* The moment the rate was taken, to the minute. This used to
                name the day the market figure belongs to and add "yesterday",
                which is true of the feed — it publishes a day behind — but
                reads as though nothing has happened since. What someone wants
                from this line is when the number in front of them arrived. */}
            <CardDescription>
              {source === "live" && checkedAt
                ? `Market rate from ${formatStamp(checkedAt, settings.timeFormat)}.`
                : source === "live"
                  ? `Market rate from ${formatDate(updatedAt)}${age === 0 ? " — today" : age === 1 ? " — yesterday" : ` — ${age} days ago`}.`
                  : "Built-in rate — today's market rate is on its way."}
            </CardDescription>
          </div>
          <RateFreshness checkedAt={checkedAt} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Just the pair in play, not a table of everything. */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-muted-foreground">
            1 {CURRENCY_NAMES[from]} equals
          </span>
          <span className="text-3xl leading-tight font-semibold tracking-tight tabular-nums">
            <span className="mr-1 text-2xl font-normal text-muted-foreground">
              {CURRENCY_SYMBOLS[to]}
            </span>
            {samePair ? "1.00" : formatRateNumber(rate, to)}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              {CURRENCY_NAMES[to]}
            </span>
          </span>
        </div>

        <div className="relative flex flex-col gap-2">
          <CurrencyField
            id="convert-from"
            label="Amount to convert"
            value={from}
            onValueChange={setFrom}
            amount={amount}
            onAmountChange={setAmount}
          />

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label="Swap currencies"
                  onClick={swap}
                  className="absolute top-1/2 left-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-all duration-300 ease-out hover:rotate-180 hover:text-foreground active:scale-90"
                />
              }
            >
              <ArrowUpDown className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="right">Swap currencies</TooltipContent>
          </Tooltip>

          <CurrencyField
            id="convert-to"
            label="Converted amount"
            value={to}
            onValueChange={setTo}
            amount={formatAmountNumber(converted)}
            readOnly
          />
        </div>

        {/* Small custom-rate switch, right under the calculator it affects. */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={useCustomRate}
            onClick={() => {
              const next = !useCustomRate
              setUseCustomRate(next)
              if (next && !customRate) setCustomRate(liveRate.toFixed(2))
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              useCustomRate
                ? "border-transparent bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Pencil className="size-3" />
            Custom rate
          </button>

          {useCustomRate ? (
            <div className="flex flex-1 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="shrink-0">1 {from} =</span>
              <Input
                aria-label="Custom rate"
                inputMode="decimal"
                value={customRate}
                onChange={(event) => setCustomRate(event.target.value)}
                className="h-8 w-28 tabular-nums"
              />
              <span className="shrink-0">{to}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
