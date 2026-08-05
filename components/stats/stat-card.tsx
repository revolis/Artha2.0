"use client"

import * as React from "react"
import { curveCardinal } from "@visx/curve"

import {
  Area,
  AreaChart,
  ChartStatFlow,
  LinearGradient,
} from "@/components/charts"
import {
  StatCardChart,
  statCardLabelClassName,
  statCardValueClassName,
} from "@/components/stat-card-chart"
import {
  StatCardHoverBridge,
  type StatCardHoverState,
} from "@/components/stat-card-hover-bridge"
import { TrendBadge } from "@/components/trend-badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { StatPoint } from "@/lib/stat-series"

const usdFormat = {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
} as const

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" })
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface StatCardProps {
  title: string
  /** One point per bucket, for the sparkline. */
  data: StatPoint[]
  /** Headline figure shown at rest, where the original card showed an average. */
  value: number
  /** Word under the figure at rest. Replaced by the bucket label on hover. */
  restLabel?: string
  /** Percent change between the last two active buckets. Hidden when null. */
  trend?: number | null
  /** Line colour. Defaults to the neutral chart line. */
  color?: string
  /** Unique id — gradients are referenced by id, so cards must not collide. */
  gradientId: string
  /** Intl.NumberFormat options. Defaults to whole-dollar USD. */
  formatOptions?: Record<string, unknown>
  /** Label buckets by day rather than month. */
  granularity?: "month" | "day"
}

export function StatCard({
  title,
  data,
  value,
  restLabel = "Net",
  trend = null,
  color = "var(--chart-line-primary)",
  gradientId,
  formatOptions = usdFormat,
  granularity = "month",
}: StatCardProps) {
  const [hover, setHover] = React.useState<StatCardHoverState>({
    value: null,
    label: null,
    trend: null,
  })

  const formatLabel = React.useMemo(
    () => (granularity === "day" ? formatDayLabel : formatMonthLabel),
    [granularity]
  )

  // At rest the card reports the period total; hovering reads out that bucket.
  const displayValue = hover.value ?? value
  const displayLabel = hover.label ?? restLabel
  const displayTrend = hover.trend ?? trend

  return (
    <Card className="w-full gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <TrendBadge value={displayTrend} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4 pt-2 pb-3">
        <ChartStatFlow
          formatOptions={formatOptions}
          label={displayLabel}
          labelClassName={statCardLabelClassName}
          value={displayValue}
          valueClassName={statCardValueClassName}
        />

        <StatCardChart size="sm">
          {data.length > 1 ? (
            <AreaChart
              aspectRatio="2.5 / 1"
              className="w-full"
              data={data}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <StatCardHoverBridge
                dataKey="value"
                formatLabel={formatLabel}
                onHoverChange={setHover}
              />
              <LinearGradient
                from={color}
                fromOpacity={0.45}
                id={gradientId}
                to={color}
                toOpacity={0}
              />
              <Area
                curve={curveCardinal.tension(0.65)}
                dataKey="value"
                fill={`url(#${gradientId})`}
                fillOpacity={1}
                gradientToOpacity={0}
                showHighlight
                stroke={color}
                strokeWidth={2}
              />
            </AreaChart>
          ) : null}
        </StatCardChart>
      </CardContent>
    </Card>
  )
}
