"use client"

import Link from "next/link"

import { Area, AreaChart } from "@/components/charts/area-chart"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip"
import { XAxis } from "@/components/charts/x-axis"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/mock-data"
import type { DualSeriesPoint, MonthOverMonth } from "@/lib/portfolio"
import { cn } from "@/lib/utils"

const PORTFOLIO_COLOR = "var(--chart-line-primary)"
const INCOME_COLOR = "var(--chart-line-secondary)"

interface PortfolioCardProps {
  series: DualSeriesPoint[]
  momentum: MonthOverMonth
  /** Net income before any cash moved in or out. */
  netIncome: number
  cashOut: number
  cashIn: number
}

export function PortfolioCard({
  series,
  momentum,
  netIncome,
  cashOut,
  cashIn,
}: PortfolioCardProps) {
  const up = momentum.change >= 0

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
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
                  <span
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      up ? "text-success" : "text-destructive"
                    )}
                  >
                    {up ? "+" : "−"}
                    {formatMoney(Math.abs(momentum.change), "USD")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    vs last month
                  </span>
                </>
              )}
            </div>
          </div>

          {/* The same year before any cash left or entered, so the gap between
              the two figures is exactly the P2P movement. */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Gross Portfolio Value
            </span>
            <span className="text-4xl font-semibold text-muted-foreground tabular-nums">
              {formatMoney(netIncome, "USD")}
            </span>
            <span className="text-sm text-muted-foreground">
              −{formatMoney(cashOut, "USD")} cashed out · +
              {formatMoney(cashIn, "USD")} cashed in
            </span>
          </div>

          <Button
            variant="link"
            size="sm"
            className="px-0"
            render={<Link href="/portfolio" />}
            nativeButton={false}
          >
            View full portfolio
          </Button>
        </div>

        {series.length > 1 ? (
          <>
            <AreaChart
              data={series}
              xDataKey="date"
              className="w-full"
              style={{ aspectRatio: "auto", height: 260 }}
              margin={{ top: 20, right: 24, bottom: 30, left: 24 }}
            >
              <Grid horizontal />
              <XAxis />
              <Area dataKey="netIncome" fill={INCOME_COLOR} />
              <Area dataKey="portfolio" fill={PORTFOLIO_COLOR} />
              <ChartTooltip
                rows={(point) => [
                  {
                    color: PORTFOLIO_COLOR,
                    label: "Portfolio",
                    value: formatMoney(Number(point.portfolio), "USD"),
                  },
                  {
                    color: INCOME_COLOR,
                    label: "Before cash moves",
                    value: formatMoney(Number(point.netIncome), "USD"),
                  },
                ]}
              />
            </AreaChart>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: PORTFOLIO_COLOR }}
                />
                Net portfolio value
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: INCOME_COLOR }}
                />
                Gross Portfolio Value
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not enough entries yet to draw a trend.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
