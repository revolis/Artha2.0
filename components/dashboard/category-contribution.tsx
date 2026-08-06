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

// Slices cycle through the theme's categorical chart tokens.
const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

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

  const pieData = React.useMemo(
    () =>
      slices.map((slice, index) => ({
        label: slice.name,
        value: slice.income,
        color: SLICE_COLORS[index % SLICE_COLORS.length],
      })),
    [slices]
  )

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
