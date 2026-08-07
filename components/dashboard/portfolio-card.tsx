"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, TrendingDown, TrendingUp } from "@/components/icons"

import { Area, AreaChart } from "@/components/charts/area-chart"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip"
import { XAxis } from "@/components/charts/x-axis"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatMoney } from "@/lib/mock-data"
import {
  PORTFOLIO_RANGES,
  sliceSeries,
  type DualSeriesPoint,
  type MonthOverMonth,
  type PortfolioRange,
} from "@/lib/portfolio"
import { cn } from "@/lib/utils"

const PORTFOLIO_COLOR = "var(--chart-line-primary)"
const INCOME_COLOR = "var(--chart-line-secondary)"

interface PortfolioCardProps {
  series: DualSeriesPoint[]
  momentum: MonthOverMonth
  /** The same month-on-month comparison, before cash moved in or out. */
  grossMomentum: MonthOverMonth
  /** Net income before any cash moved in or out. */
  netIncome: number
  cashOut: number
  cashIn: number
}

/** The month-on-month move, stated plainly rather than badged. */
function Momentum({ momentum }: { momentum: MonthOverMonth }) {
  const up = momentum.change >= 0

  if (momentum.change === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        No change yet this month
      </span>
    )
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "flex items-center gap-1 font-medium tabular-nums",
          up ? "text-success" : "text-destructive"
        )}
      >
        {up ? (
          <TrendingUp className="size-3.5" />
        ) : (
          <TrendingDown className="size-3.5" />
        )}
        {momentum.percent !== null
          ? `${up ? "+" : "−"}${Math.abs(momentum.percent).toFixed(2)}%`
          : `${up ? "+" : "−"}${formatMoney(Math.abs(momentum.change), "USD")}`}
      </span>
      {momentum.percent !== null ? (
        <span className="tabular-nums">
          {up ? "+" : "−"}
          {formatMoney(Math.abs(momentum.change), "USD")}
        </span>
      ) : null}
      <span>vs last month</span>
    </span>
  )
}

/** Big figure with the cash-movement breakdown tucked behind a hover. */
function ValueStat({
  label,
  value,
  muted,
  cashOut,
  cashIn,
  explanation,
  children,
}: {
  label: string
  value: number
  muted?: boolean
  cashOut: number
  cashIn: number
  explanation: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={cn(
                "w-fit cursor-help text-3xl font-semibold tabular-nums underline decoration-muted-foreground/30 decoration-dotted underline-offset-8",
                muted && "text-muted-foreground"
              )}
            />
          }
        >
          {formatMoney(value, "USD")}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64">
          <span className="flex flex-col gap-1">
            <span>{explanation}</span>
            <span className="tabular-nums">
              −{formatMoney(cashOut, "USD")} cashed out · +
              {formatMoney(cashIn, "USD")} cashed in
            </span>
          </span>
        </TooltipContent>
      </Tooltip>
      {children}
    </div>
  )
}

export function PortfolioCard({
  series,
  momentum,
  grossMomentum,
  netIncome,
  cashOut,
  cashIn,
}: PortfolioCardProps) {
  // Opens on the year so the dashboard shows the whole story by default. The
  // shorter windows are there when you want the two lines further apart — a
  // wider window means a wider axis, which squeezes the gap between them.
  const [range, setRange] = React.useState<PortfolioRange>("ytd")

  const days =
    PORTFOLIO_RANGES.find((item) => item.value === range)?.days ?? null
  const visible = React.useMemo(() => sliceSeries(series, days), [series, days])

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-4">
          <ValueStat
            label="Net Portfolio Value"
            value={momentum.current}
            cashOut={cashOut}
            cashIn={cashIn}
            explanation="What you hold after money moved to and from cash."
          >
            <Momentum momentum={momentum} />
          </ValueStat>

          {/* The same year before any cash left or entered, so the gap between
              the two figures is exactly the P2P movement. */}
          <ValueStat
            label="Gross Portfolio Value"
            value={netIncome}
            muted
            cashOut={cashOut}
            cashIn={cashIn}
            explanation="Profit minus loss, fees and tax — before any cash moved."
          >
            <Momentum momentum={grossMomentum} />
          </ValueStat>

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            render={<Link href="/portfolio" />}
            nativeButton={false}
          >
            View full portfolio
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>

        {series.length > 1 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-0.5 w-4 rounded-full"
                    style={{ backgroundColor: PORTFOLIO_COLOR }}
                  />
                  Net
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-0.5 w-4 rounded-full"
                    style={{ backgroundColor: INCOME_COLOR }}
                  />
                  Gross
                </span>
              </div>

              {/* Narrowing the window rescales the chart, so a steep recent
                  climb stops flattening everything before it. */}
              <div className="flex items-center gap-1 rounded-lg border p-0.5">
                {PORTFOLIO_RANGES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRange(item.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      range === item.value
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <AreaChart
              data={visible}
              xDataKey="date"
              className="w-full"
              style={{ aspectRatio: "auto", height: 190 }}
              margin={{ top: 16, right: 20, bottom: 26, left: 20 }}
              // Portfolio totals live far from zero, so anchoring the axis
              // there wastes most of the height and flattens the line.
              yBaseline="auto"
              // Switching range should land on the new scale straight away
              // rather than easing into it.
              yDomainTween={false}
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
