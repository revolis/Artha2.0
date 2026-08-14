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

export function CategoryContribution({
  entries,
  year,
}: {
  entries: Entry[]
  year: number
}) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  const { convert, displayCurrency, privacyMode } = useMoney()

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

  // A category can earn and still finish behind. It cannot be drawn as a share
  // of a positive total, so it is named underneath rather than dropped in
  // silence — a category you know made money simply vanishing is worse than a
  // sentence explaining it.
  const netNegative = React.useMemo(
    () => breakdown.filter((row) => row.income > 0 && row.net <= 0),
    [breakdown]
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
            ? `${leader.name} · ${((leader.net / totalNet) * 100).toFixed(0)}% of net income for ${year}`
            : `No net income recorded for ${year}`}
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
                defaultLabel="Net income"
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

            {/* Named rather than dropped in silence: a category you know
                earned this year, absent from the chart with no explanation,
                reads as the chart being wrong. */}
            {netNegative.length > 0 ? (
              <p className="self-start text-xs text-muted-foreground">
                {netNegative.map((row) => row.name).join(", ")}{" "}
                {netNegative.length === 1 ? "earned but" : "earned but each"}{" "}
                finished the year behind, so{" "}
                {netNegative.length === 1 ? "it is" : "they are"} not shown.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
