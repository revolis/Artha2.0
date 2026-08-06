"use client"

import * as React from "react"
import { Check, Pencil, RotateCcw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CURRENCY_NAMES, formatRateNumber } from "@/lib/rates"
import type { RateTable } from "@/lib/rate-data"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"

const EDITABLE: Currency[] = ["NPR", "INR", "EUR", "GBP", "AED"]

/**
 * Today's rates at a glance, and the place to record new ones. Everything is
 * entered by hand for now, so the figures are only ever what was actually
 * looked up — never an estimate.
 */
export function RateEditor({
  rates,
  onSave,
  onReset,
  stale,
}: {
  rates: RateTable
  onSave: (next: RateTable) => void
  onReset: () => void
  stale: boolean
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState<Record<string, string>>({})

  function startEditing() {
    const next: Record<string, string> = {}
    for (const code of EDITABLE) next[code] = String(rates[code])
    setDraft(next)
    setEditing(true)
  }

  function save() {
    const next: RateTable = { ...rates }
    for (const code of EDITABLE) {
      const value = Number(draft[code])
      if (value > 0) next[code] = value
    }
    onSave(next)
    setEditing(false)
  }

  const invalid = EDITABLE.some((code) => !(Number(draft[code]) > 0))

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Today&apos;s rates</span>
          <span className="text-xs text-muted-foreground">
            What 1 US Dollar buys. Check them each day and record the change.
          </span>
        </div>

        {editing ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X data-icon="inline-start" />
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={invalid}>
              <Check data-icon="inline-start" />
              Save rates
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw data-icon="inline-start" />
              Reset
            </Button>
            <Button
              variant={stale ? "default" : "outline"}
              size="sm"
              onClick={startEditing}
            >
              <Pencil data-icon="inline-start" />
              Update rates
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {EDITABLE.map((code) => (
          <div
            key={code}
            className={cn(
              "flex flex-col gap-1 rounded-lg border bg-muted/30 px-3 py-2",
              editing && "bg-background"
            )}
          >
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
              USD → {code}
            </span>
            {editing ? (
              <Input
                aria-label={`USD to ${CURRENCY_NAMES[code]} rate`}
                inputMode="decimal"
                value={draft[code] ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [code]: event.target.value }))
                }
                className="h-8 px-2 text-sm tabular-nums"
              />
            ) : (
              <span className="text-base font-semibold tabular-nums">
                {formatRateNumber(rates[code], code)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
