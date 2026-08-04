"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { getPerformanceBreakdown } from "@/lib/analytics"
import { formatMoney } from "@/lib/mock-data"
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
  const slices = React.useMemo(
    () =>
      getPerformanceBreakdown(entries, year, (entry) => entry.category)
        .filter((row) => row.income > 0)
        .sort((a, b) => b.income - a.income),
    [entries, year]
  )

  // Give every slice a stable colour and a chart config entry so the shared
  // tooltip renders the category name rather than the raw data key.
  const { data, chartConfig } = React.useMemo(() => {
    const config: ChartConfig = {}
    const rows = slices.map((slice, index) => {
      const color = SLICE_COLORS[index % SLICE_COLORS.length]
      config[slice.name] = { label: slice.name, color }
      return {
        name: slice.name,
        income: slice.income,
        share: slice.share,
        fill: color,
      }
    })
    return { data: rows, chartConfig: config }
  }, [slices])

  const leader = slices[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category contribution</CardTitle>
        <CardDescription>
          {leader
            ? `${leader.name} · ${leader.share.toFixed(0)}% of income for ${year}`
            : `No income recorded for ${year}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add entries with a category to see how your income splits up.
          </p>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-56"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="name"
                      formatter={(value) => formatMoney(Number(value), "USD")}
                    />
                  }
                />
                {/* Animation left on would leave the sectors unrendered. */}
                <Pie
                  data={data}
                  dataKey="income"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {data.map((slice) => (
                    <Cell key={slice.name} fill={slice.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              {data.map((slice) => (
                <div key={slice.name} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: slice.fill }}
                  />
                  <span className="truncate text-sm">{slice.name}</span>
                  <span className="ml-auto text-sm font-medium tabular-nums">
                    {slice.share.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>

            {leader ? (
              <p className="text-sm text-muted-foreground">
                {leader.name} contributes {leader.share.toFixed(0)}% of income
                for {year}.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
