"use client"

import * as React from "react"
import { ArrowUpDown, Check, Loader2, Pencil, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

const CURRENCIES: Currency[] = ["USD", "NPR", "INR", "EUR", "GBP", "AED"]

const currencyItems = CURRENCIES.map((code) => ({
  value: code,
  label: `${CURRENCY_SYMBOLS[code]}  ${code} — ${CURRENCY_NAMES[code]}`,
}))

type UpdateState = "idle" | "loading" | "done" | "error"

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

/** Update button that reports what it's doing while it does it. */
function UpdateRatesButton({
  state,
  onClick,
}: {
  state: UpdateState
  onClick: () => void
}) {
  return (
    <Button
      variant={state === "error" ? "destructive" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={state === "loading"}
      className="min-w-36 transition-all duration-300"
    >
      {state === "loading" ? (
        <>
          <Loader2 data-icon="inline-start" className="animate-spin" />
          Updating…
        </>
      ) : state === "done" ? (
        <>
          <Check data-icon="inline-start" className="text-success" />
          Done — updated
        </>
      ) : state === "error" ? (
        <>
          <RefreshCw data-icon="inline-start" />
          Couldn&apos;t reach — retry
        </>
      ) : (
        <>
          <RefreshCw data-icon="inline-start" />
          Update rates
        </>
      )}
    </Button>
  )
}

/**
 * Converts between two currencies at the live mid-market rate, or at a rate
 * the user types in for a one-off deal. Updating fetches today's rates and
 * applies them to every amount on the site.
 */
export function CurrencyConverter({ className }: { className?: string }) {
  const { rates, updatedAt, source, fetchLiveRates } = useRates()

  const [from, setFrom] = React.useState<Currency>("USD")
  const [to, setTo] = React.useState<Currency>("NPR")
  const [amount, setAmount] = React.useState("1")
  const [useCustomRate, setUseCustomRate] = React.useState(false)
  const [customRate, setCustomRate] = React.useState("")
  const [updateState, setUpdateState] = React.useState<UpdateState>("idle")

  const resetTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => {
    return () => window.clearTimeout(resetTimer.current)
  }, [])

  const liveRate = rateFor(rates, from, to)
  const parsedCustom = Number(customRate)
  const customValid = useCustomRate && parsedCustom > 0
  const rate = customValid ? parsedCustom : liveRate

  const parsedAmount = Number(amount.replace(/,/g, ""))
  const converted = Number.isFinite(parsedAmount) ? parsedAmount * rate : 0

  const age = daysSince(updatedAt)

  async function update() {
    setUpdateState("loading")
    try {
      await fetchLiveRates()
      setUpdateState("done")
      resetTimer.current = window.setTimeout(() => setUpdateState("idle"), 2200)
    } catch {
      setUpdateState("error")
      resetTimer.current = window.setTimeout(() => setUpdateState("idle"), 3500)
    }
  }

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
            <CardDescription>
              {source === "live"
                ? `Market rate from ${formatDate(updatedAt)}${age === 0 ? " — today" : age === 1 ? " — yesterday" : ` — ${age} days ago`}.`
                : "Built-in rate — press Update for today's market rate."}
            </CardDescription>
          </div>
          <UpdateRatesButton state={updateState} onClick={update} />
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
