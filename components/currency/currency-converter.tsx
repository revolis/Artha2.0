"use client"

import * as React from "react"
import { ArrowUpDown, Pencil, TrendingDown, TrendingUp } from "lucide-react"

import { RateSparkline } from "@/components/currency/rate-sparkline"
import { Badge } from "@/components/ui/badge"
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
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CURRENCY_NAMES,
  formatAmountNumber,
  formatRateNumber,
  getRate,
  getRateHistory,
  RATE_RANGES,
  type RateRange,
} from "@/lib/rates"
import type { Currency } from "@/lib/types"
import { useSettings } from "@/lib/use-settings"
import { cn } from "@/lib/utils"

const CURRENCIES: Currency[] = ["USD", "NPR", "INR", "EUR", "GBP", "AED"]

const currencyItems = CURRENCIES.map((code) => ({
  value: code,
  label: `${code} — ${CURRENCY_NAMES[code]}`,
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
      <Input
        id={id}
        aria-label={label}
        inputMode="decimal"
        value={amount}
        readOnly={readOnly}
        onChange={(event) => onAmountChange?.(event.target.value)}
        className={cn(
          "h-12 flex-1 rounded-none border-0 bg-transparent text-base tabular-nums shadow-none focus-visible:ring-0",
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
          className="h-12 w-[8.5rem] shrink-0 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        >
          <SelectValue />
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
 * Converts between any two currencies, either at the stored rate or at a rate
 * the user types in themselves — handy for pricing a P2P trade before logging
 * it. The chart is generated sample history until the daily sync is wired up.
 */
export function CurrencyConverter({ className }: { className?: string }) {
  const { settings } = useSettings()

  const [from, setFrom] = React.useState<Currency>("USD")
  const [to, setTo] = React.useState<Currency>("NPR")
  const [amount, setAmount] = React.useState("1")
  const [useCustomRate, setUseCustomRate] = React.useState(false)
  const [customRate, setCustomRate] = React.useState("")
  const [range, setRange] = React.useState<RateRange>("1y")

  const liveRate = getRate(from, to)
  const parsedCustom = Number(customRate)
  const customValid = useCustomRate && parsedCustom > 0
  const rate = customValid ? parsedCustom : liveRate

  const parsedAmount = Number(amount.replace(/,/g, ""))
  const converted = Number.isFinite(parsedAmount) ? parsedAmount * rate : 0

  const days = RATE_RANGES.find((item) => item.value === range)?.days ?? 365
  const history = React.useMemo(
    () => getRateHistory(from, to, days, settings.rateUpdatedAt),
    [from, to, days, settings.rateUpdatedAt]
  )

  const changePercent =
    history.length > 1
      ? ((history[history.length - 1].rate - history[0].rate) /
          history[0].rate) *
        100
      : 0
  const up = changePercent >= 0

  function swap() {
    setFrom(to)
    setTo(from)
    // An inverted rate is what you'd want next, not the same number.
    if (customValid)
      setCustomRate(String(Number((1 / parsedCustom).toFixed(6))))
  }

  const samePair = from === to

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Currency Converter</CardTitle>
            <CardDescription>
              Convert at the stored rate, or punch in your own.
            </CardDescription>
          </div>
          {customValid ? (
            <Badge variant="secondary" className="gap-1">
              <Pencil className="size-3" />
              Custom rate
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              1 {CURRENCY_NAMES[from]} equals
            </span>
            <span className="text-3xl leading-tight font-semibold tracking-tight tabular-nums">
              {formatRateNumber(rate, to)}{" "}
              <span className="text-xl font-normal text-muted-foreground">
                {CURRENCY_NAMES[to]}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {customValid
                ? "Your own rate — the stored rate is untouched."
                : `Stored rate, last updated ${new Date(`${settings.rateUpdatedAt}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.`}
            </span>
          </div>

          {/* The two amount rows, with the swap button sitting between them. */}
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

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Use my own rate</span>
                <span className="text-xs text-muted-foreground">
                  For a P2P deal at a rate you agreed yourself.
                </span>
              </div>
              <Switch
                aria-label="Use my own rate"
                checked={useCustomRate}
                onCheckedChange={(checked) => {
                  setUseCustomRate(checked)
                  if (checked && !customRate) {
                    setCustomRate(liveRate.toFixed(2))
                  }
                }}
              />
            </div>

            {useCustomRate ? (
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">
                  1 {from} =
                </span>
                <Input
                  aria-label="Custom rate"
                  inputMode="decimal"
                  value={customRate}
                  onChange={(event) => setCustomRate(event.target.value)}
                  className="h-9 flex-1 tabular-nums"
                />
                <span className="shrink-0 text-sm text-muted-foreground">
                  {to}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            {samePair ? (
              <span className="text-sm text-muted-foreground">
                Same currency — nothing to chart.
              </span>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium tabular-nums",
                  up ? "text-success" : "text-destructive"
                )}
              >
                {up ? (
                  <TrendingUp className="size-4" />
                ) : (
                  <TrendingDown className="size-4" />
                )}
                {up ? "+" : ""}
                {changePercent.toFixed(2)}%
                <span className="font-normal text-muted-foreground">
                  over {RATE_RANGES.find((item) => item.value === range)?.label}
                </span>
              </span>
            )}

            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              {RATE_RANGES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRange(item.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    range === item.value
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {samePair ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Pick two different currencies
            </div>
          ) : (
            <RateSparkline points={history} />
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Sample history for now. Once the backend is connected, rates refresh
            once a day and this chart shows the real thing.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
