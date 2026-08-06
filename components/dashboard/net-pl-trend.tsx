"use client"

import * as React from "react"

import { Bar } from "@/components/charts/bar"
import { BarChart } from "@/components/charts/bar-chart"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { Grid } from "@/components/charts/grid"
import { PatternLines } from "@/components/charts/visx-pattern"
import { ChartTooltip } from "@/components/charts/tooltip"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const INCOME_COLOR = "var(--success)"
const EXPENSE_COLOR = "var(--destructive)"
const NET_COLOR = "var(--chart-line-primary)"
const HATCH_ID = "net-pl-trend-hatch"

function TrendChart({
  entries,
  year,
  timeframe,
}: {
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
    <BarChart
      data={data}
      xDataKey="label"
      className="w-full"
      aspectRatio="8 / 3"
      margin={{ top: 16, right: 16, bottom: 32, left: 52 }}
      barGap={0.28}
    >
      <Grid horizontal />
      {/* Net profit is hatched so it reads as a derived figure rather than a
          third independent amount. */}
      <PatternLines
        height={6}
        id={HATCH_ID}
        orientation={["diagonal"]}
        stroke={NET_COLOR}
        strokeWidth={1.5}
        width={6}
      />
      <Bar dataKey="income" fill={INCOME_COLOR} />
      <Bar dataKey="expense" fill={EXPENSE_COLOR} />
      <Bar dataKey="net" fill={`url(#${HATCH_ID})`} stroke={NET_COLOR} />
      <BarXAxis />
      <ChartTooltip
        rows={(point) => [
          {
            color: INCOME_COLOR,
            label: "Gross income",
            value: formatMoney(Number(point.income), "USD"),
          },
          {
            color: EXPENSE_COLOR,
            label: "Net loss",
            value: formatMoney(Number(point.expense), "USD"),
          },
          {
            color: NET_COLOR,
            label: "Net profit",
            value: formatMoney(Number(point.net), "USD"),
          },
        ]}
      />
    </BarChart>
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
    <Card size="sm">
      <CardHeader>
        <CardTitle>Net P/L trend</CardTitle>
        <CardDescription>Timeframe: {activeLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as TrendTimeframe)}
          className="flex flex-col gap-4"
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

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[3px]"
              style={{ backgroundColor: INCOME_COLOR }}
            />
            Gross income
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[3px]"
              style={{ backgroundColor: EXPENSE_COLOR }}
            />
            Net loss
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[3px] border"
              style={{ borderColor: NET_COLOR }}
            />
            Net profit
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
