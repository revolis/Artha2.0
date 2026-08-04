"use client"

import Link from "next/link"
import { Area, AreaChart, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatMoney } from "@/lib/mock-data"
import type { MonthOverMonth, SeriesPoint } from "@/lib/portfolio"
import { cn } from "@/lib/utils"

const chartConfig = {
  value: { label: "Portfolio", color: "var(--success)" },
} satisfies ChartConfig

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`))
}

interface PortfolioCardProps {
  series: SeriesPoint[]
  momentum: MonthOverMonth
}

export function PortfolioCard({ series, momentum }: PortfolioCardProps) {
  const up = momentum.change >= 0
  const tone = up ? "text-success" : "text-destructive"

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Net Portfolio Value
          </span>
          <span className="text-4xl font-semibold tabular-nums">
            {formatMoney(momentum.current, "USD")}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {momentum.change === 0 ? (
              <span className="text-sm text-muted-foreground">
                No change yet this month
              </span>
            ) : (
              <>
                {momentum.percent !== null ? (
                  <Badge variant={up ? "secondary" : "destructive"}>
                    {up ? "+" : "−"}
                    {Math.abs(momentum.percent).toFixed(2)}%
                  </Badge>
                ) : null}
                <span className={cn("text-sm font-medium tabular-nums", tone)}>
                  {up ? "+" : "−"}
                  {formatMoney(Math.abs(momentum.change), "USD")}
                </span>
                <span className="text-sm text-muted-foreground">
                  vs last month
                </span>
              </>
            )}
          </div>
          <Button
            variant="link"
            size="sm"
            className="w-fit px-0"
            render={<Link href="/portfolio" />}
            nativeButton={false}
          >
            View full portfolio
          </Button>
        </div>

        {series.length > 1 ? (
          <ChartContainer
            config={chartConfig}
            className="h-28 w-full lg:max-w-md"
          >
            <AreaChart data={series} margin={{ top: 4, bottom: 4 }}>
              <defs>
                <linearGradient
                  id="fillDashboardValue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 20", "dataMax + 20"]} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDay(String(value))}
                    formatter={(value) => formatMoney(Number(value), "USD")}
                  />
                }
              />
              <Area
                dataKey="value"
                type="stepAfter"
                stroke="var(--color-value)"
                strokeWidth={2}
                fill="url(#fillDashboardValue)"
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not enough entries yet to draw a trend.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
