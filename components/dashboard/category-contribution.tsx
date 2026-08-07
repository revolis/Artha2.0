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

  const slices = React.useMemo(
    () =>
      getPerformanceBreakdown(entries, year, (entry) => entry.category)
        .filter((row) => row.income > 0)
        .sort((a, b) => b.income - a.income),
    [entries, year]
  )

  const pieData = React.useMemo(() => {
    const top = slices.slice(0, MAX_SLICES).map((slice, index) => ({
      label: slice.name,
      value: slice.income,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    }))
    const rest = slices.slice(MAX_SLICES)
    if (rest.length === 0) return top
    return [
      ...top,
      {
        label: `Other (${rest.length})`,
        value: rest.reduce((sum, slice) => sum + slice.income, 0),
        color: "var(--muted-foreground)",
      },
    ]
  }, [slices])

  const totalIncome = slices.reduce((sum, slice) => sum + slice.income, 0)
  const leader = slices[0]

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Category contribution</CardTitle>
        <CardDescription>
          {leader
            ? `${leader.name} · ${leader.share.toFixed(0)}% of income for ${year}`
            : `No income recorded for ${year}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {pieData.length === 0 ? (
          <p className="self-start text-sm text-muted-foreground">
            Add entries with a category to see how your income splits up.
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
                defaultLabel="Total income"
                prefix="$"
                formatOptions={{
                  notation: "standard",
                  maximumFractionDigits: 0,
                }}
              />
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
                    totalIncome > 0
                      ? `${((value / totalIncome) * 100).toFixed(0)}%`
                      : "0%"
                  }
                />
              </LegendItem>
            </Legend>
          </>
        )}
      </CardContent>
    </Card>
  )
}
