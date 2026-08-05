"use client"

import * as React from "react"
import { curveCardinal } from "@visx/curve"

import { Area, AreaChart, ChartStatFlow, LinearGradient } from "@/components/charts"
import {
  StatCardChart,
  statCardLabelClassName,
  statCardValueClassName,
} from "@/components/stat-card-chart"
import {
  formatStatCardMonth,
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

export interface MonthlyPoint {
  // Index signature so the array satisfies the chart's Record<string, unknown>.
  [key: string]: Date | number
  date: Date
  value: number
}

interface MonthlyStatCardProps {
  title: string
  /** One point per month, for the sparkline. */
  data: MonthlyPoint[]
  /** Year total shown at rest, where the original card showed an average. */
  netValue: number
  /** Percent change between the last two months with activity. */
  trend: number | null
  /** Distinct line colour per card. */
  color: string
  /** Unique id — the gradient is referenced by id, so cards must not collide. */
  gradientId: string
}

export function MonthlyStatCard({
  title,
  data,
  netValue,
  trend,
  color,
  gradientId,
}: MonthlyStatCardProps) {
  const [hover, setHover] = React.useState<StatCardHoverState>({
    value: null,
    label: null,
    trend: null,
  })

  // At rest the card reports the year's net figure; hovering reads out that
  // month instead.
  const displayValue = hover.value ?? netValue
  const displayLabel = hover.label ?? "Net"
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
          formatOptions={{
            currency: "USD",
            maximumFractionDigits: 0,
            style: "currency",
          }}
          label={displayLabel}
          labelClassName={statCardLabelClassName}
          value={displayValue}
          valueClassName={statCardValueClassName}
        />

        <StatCardChart size="sm">
          <AreaChart
            aspectRatio="2.5 / 1"
            className="w-full"
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <StatCardHoverBridge
              dataKey="value"
              formatLabel={formatStatCardMonth}
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
        </StatCardChart>
      </CardContent>
    </Card>
  )
}
