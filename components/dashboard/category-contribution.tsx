"use client"

import * as React from "react"

import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendValue,
} from "@/components/charts/legend"
import { PieCenter } from "@/components/charts/pie-center"
import { PieChart } from "@/components/charts/pie-chart"
import { PieSlice } from "@/components/charts/pie-slice"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPerformanceBreakdown } from "@/lib/analytics"
import { getEntryYear, getNetAmount } from "@/lib/mock-data"
import { CURRENCY_SYMBOLS } from "@/lib/rate-data"
import { PRIVACY_MASK } from "@/lib/money"
import { useMoney } from "@/lib/use-money"
import type { Entry } from "@/lib/types"

// Ten distinct slice colours from five theme tokens: each token at full
// strength, then a softer version of it. With a couple of dozen categories in
// play, cycling five colours alone would give neighbouring slices the same fill.
const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "color-mix(in oklab, var(--chart-1) 55%, var(--card))",
  "color-mix(in oklab, var(--chart-2) 55%, var(--card))",
  "color-mix(in oklab, var(--chart-3) 55%, var(--card))",
  "color-mix(in oklab, var(--chart-4) 55%, var(--card))",
  "color-mix(in oklab, var(--chart-5) 55%, var(--card))",
]

// Everything past this many categories is rolled into a single "Other" slice,
// so a long tail of 1% earners doesn't turn the legend into a wall of text.
const MAX_SLICES = 9

// Same idea for the list of what finished behind.
const MAX_BEHIND = 5

export function CategoryContribution({
  entries,
  year,
}: {
  entries: Entry[]
  year: number
}) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  const { convert, displayCurrency, privacyMode, formatMoney } = useMoney()

  // Net, not gross. Gross flattered any category that earned a lot and gave
  // most of it back in losses, fees and tax — it read as the biggest earner
  // while contributing less than a quieter one beside it.
  const breakdown = React.useMemo(
    () => getPerformanceBreakdown(entries, year, (entry) => entry.category),
    [entries, year]
  )

  const slices = React.useMemo(
    () => breakdown.filter((row) => row.net > 0).sort((a, b) => b.net - a.net),
    [breakdown]
  )

  // Everything that finished behind — a category that earned and gave more
  // back, and the pure costs like tax and fees, which never earn at all. None
  // of them can be a slice of a positive total, so they are listed with their
  // figures underneath instead. Naming one without its number, as this did at
  // first, is the worst of both: you are told something is missing and not
  // what it was.
  const behind = React.useMemo(
    () => breakdown.filter((row) => row.net < 0).sort((a, b) => a.net - b.net),
    [breakdown]
  )

  // The costliest few by name, the rest as one row. A ledger with a category
  // per fee can put a dozen small ones here, and a list that long buries the
  // chart it is meant to be a footnote to. The rolled-up row still carries its
  // total, so the figures on screen continue to add up to the net below.
  const behindShown = behind.slice(0, MAX_BEHIND)
  const behindRest = behind.slice(MAX_BEHIND)
  const behindRestTotal = behindRest.reduce((sum, row) => sum + row.net, 0)

  // The year's actual net, straight off the entries — the same sum the Net P/L
  // card shows. The donut cannot equal this and should not pretend to: it
  // holds only the categories that came out ahead, so it reads high by
  // whatever the rest cost. Stating both, and the sentence that connects them,
  // is what stops the two cards looking like they disagree.
  const yearNet = React.useMemo(
    () =>
      entries
        .filter((entry) => getEntryYear(entry) === year)
        .reduce((sum, entry) => sum + getNetAmount(entry), 0),
    [entries, year]
  )

  const pieData = React.useMemo(() => {
    // Converted here rather than at the end: the centre reads the raw value
    // and formats it itself, so it has to arrive already in the reader's
    // currency. Shares are unaffected — scaling every slice by the same rate
    // leaves the proportions exactly where they were.
    const toDisplay = (usd: number) => convert(usd, "USD", displayCurrency)
    const top = slices.slice(0, MAX_SLICES).map((slice, index) => ({
      label: slice.name,
      value: toDisplay(slice.net),
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    }))
    const rest = slices.slice(MAX_SLICES)
    if (rest.length === 0) return top
    return [
      ...top,
      {
        label: `Other (${rest.length})`,
        value: toDisplay(rest.reduce((sum, slice) => sum + slice.net, 0)),
        color: "var(--muted-foreground)",
      },
    ]
  }, [slices, convert, displayCurrency])

  const totalNet = slices.reduce((sum, slice) => sum + slice.net, 0)
  const leader = slices[0]

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Category contribution</CardTitle>
        <CardDescription>
          {/* share on the row is a share of gross, so the net share is
              worked out here rather than reused. */}
          {leader && totalNet > 0
            ? `${leader.name} · ${((leader.net / totalNet) * 100).toFixed(0)}% of what ${year} contributed`
            : `Nothing contributed in ${year} yet`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {pieData.length === 0 ? (
          <p className="self-start text-sm text-muted-foreground">
            Add entries with a category to see where your net income comes from.
          </p>
        ) : (
          <>
            {/* Centre value animates: the year total at rest, and the hovered
                category's earnings while pointing at a slice. */}
            <PieChart
              data={pieData}
              hoveredIndex={hoveredIndex}
              onHoverChange={setHoveredIndex}
              size={196}
              innerRadius={62}
              padAngle={0.02}
              cornerRadius={4}
            >
              {pieData.map((slice, index) => (
                <PieSlice index={index} key={slice.label} />
              ))}
              <PieCenter
                defaultLabel="Contributed"
                // The symbol follows the currency the reader picked; the
                // values arriving here were converted to match. Under privacy
                // the figure is replaced rather than shown, since this centre
                // formats a number directly and would otherwise be the one
                // amount on the page still legible.
                prefix={privacyMode ? "" : CURRENCY_SYMBOLS[displayCurrency]}
                formatOptions={
                  privacyMode
                    ? { notation: "compact", maximumFractionDigits: 0 }
                    : { notation: "standard", maximumFractionDigits: 0 }
                }
              >
                {/* children is a render function here, not a node. */}
                {privacyMode
                  ? () => (
                      <span className="text-xl font-semibold">
                        {PRIVACY_MASK}
                      </span>
                    )
                  : undefined}
              </PieCenter>
            </PieChart>

            {/* Two columns of single-line rows. Left to itself the legend
                stacks each marker above its label, which made it taller than
                the chart it belongs to. */}
            <Legend
              className="grid w-full gap-x-3 gap-y-0.5 sm:grid-cols-2"
              hoveredIndex={hoveredIndex}
              items={pieData}
              onHoverChange={setHoveredIndex}
            >
              <LegendItem className="flex min-w-0 items-center gap-2 px-1.5 py-1">
                <LegendMarker className="size-2 shrink-0" />
                <LegendLabel className="truncate text-xs font-medium" />
                <LegendValue
                  className="ml-auto text-xs tabular-nums"
                  formatValue={(value) =>
                    totalNet > 0
                      ? `${((value / convert(totalNet, "USD", displayCurrency)) * 100).toFixed(0)}%`
                      : "0%"
                  }
                />
              </LegendItem>
            </Legend>

            {/* The other half of the year. A donut can only draw what is
                positive, so these are given as a list with their figures
                rather than left out — they are where the difference between
                this chart and the Net P/L card comes from. */}
            {behind.length > 0 ? (
              <div className="flex w-full flex-col gap-1 border-t pt-3">
                <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Finished behind
                </span>
                {behindShown.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-3 px-1.5 text-xs"
                  >
                    <span className="min-w-0 truncate">{row.name}</span>
                    <span className="shrink-0 text-destructive tabular-nums">
                      {formatMoney(row.net, "USD")}
                    </span>
                  </div>
                ))}
                {behindRest.length > 0 ? (
                  <div className="flex items-center justify-between gap-3 px-1.5 text-xs text-muted-foreground">
                    <span>Other ({behindRest.length})</span>
                    <span className="shrink-0 tabular-nums">
                      {formatMoney(behindRestTotal, "USD")}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Says out loud why the number in the middle is not the number on
                the Net P/L card. Without this the two look like they
                disagree, which is the first thing anyone notices. */}
            <p className="w-full border-t pt-3 text-xs text-muted-foreground">
              Net P/L for {year} is{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatMoney(yearNet, "USD")}
              </span>
              : what the categories above contributed, less what those behind
              cost, plus anything recorded without a category.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
