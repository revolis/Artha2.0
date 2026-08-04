"use client"

import * as React from "react"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTrendSeries, type TrendTimeframe } from "@/lib/analytics"
import { formatMoney } from "@/lib/mock-data"
import type { Entry } from "@/lib/types"

const timeframes: { value: TrendTimeframe; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "6months", label: "6 Months" },
  { value: "yearly", label: "Yearly" },
  { value: "all", label: "All" },
]

const chartConfig = {
  net: { label: "Net P/L" },
} satisfies ChartConfig

function signed(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatMoney(Math.abs(value), "USD")}`
}

function compact(value: number): string {
  if (value === 0) return "$0"
  const abs = Math.abs(value)
  const short =
    abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${Math.round(abs)}`
  return value < 0 ? `-${short}` : short
}

function TrendChart({ entries, year, timeframe }: {
  entries: Entry[]
  year: number
  timeframe: TrendTimeframe
}) {
  const data = React.useMemo(
    () => getTrendSeries(entries, year, timeframe),
    [entries, year, timeframe]
  )

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No profit or loss entries to chart yet.
      </p>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={4}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={compact}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value) => signed(Number(value))} />
          }
        />
        {/* Bars carry the sign colour; the line traces the same values so the
            shape of the run reads at a glance. */}
        {/* isAnimationActive={false} is required: the entry animation never
            settles here, and an animating bar renders no shape at all. */}
        <Bar dataKey="net" radius={6} fillOpacity={0.7} isAnimationActive={false}>
          {data.map((point) => (
            <Cell
              key={point.label}
              fill={point.net >= 0 ? "var(--success)" : "var(--destructive)"}
            />
          ))}
        </Bar>
        <Line
          dataKey="net"
          type="monotone"
          stroke="var(--success)"
          strokeWidth={2}
          isAnimationActive={false}
          dot={{
            r: 4,
            fill: "var(--background)",
            stroke: "var(--success)",
            strokeWidth: 2,
          }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

export function NetPLTrend({
  entries,
  year,
}: {
  entries: Entry[]
  year: number
}) {
  const [timeframe, setTimeframe] = React.useState<TrendTimeframe>("monthly")
  const activeLabel =
    timeframes.find((item) => item.value === timeframe)?.label ?? "Monthly"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net P/L trend</CardTitle>
        <CardDescription>Timeframe: {activeLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as TrendTimeframe)}
          className="flex flex-col gap-6"
        >
          <TabsList className="w-fit max-w-full overflow-x-auto">
            {timeframes.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {timeframes.map((item) => (
            <TabsContent key={item.value} value={item.value}>
              <TrendChart
                entries={entries}
                year={year}
                timeframe={item.value}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
