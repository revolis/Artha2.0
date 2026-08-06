"use client"

import type { RatePoint } from "@/lib/rates"
import { cn } from "@/lib/utils"

// The path is drawn in a 0–100 box and stretched to whatever width the card
// gives it. preserveAspectRatio="none" does the stretching; the stroke keeps
// its real thickness thanks to vector-effect.
const TOP = 6
const BOTTOM = 94

function formatTick(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value)
}

function formatMonth(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** Compact rate history chart. Green when the pair rose, red when it fell. */
export function RateSparkline({
  points,
  className,
}: {
  points: RatePoint[]
  className?: string
}) {
  if (points.length < 2) return null

  const values = points.map((point) => point.rate)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = 100 / (points.length - 1)

  const coords = values.map((value, index) => {
    const x = index * step
    const y = BOTTOM - ((value - min) / span) * (BOTTOM - TOP)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const line = `M${coords.join(" L")}`
  const area = `${line} L100,100 L0,100 Z`
  const rose = values[values.length - 1] >= values[0]

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="flex flex-col justify-between py-px text-[10px] text-muted-foreground tabular-nums">
        <span>{formatTick(max)}</span>
        <span>{formatTick(min + span / 2)}</span>
        <span>{formatTick(min)}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          className={cn(
            "relative h-24 w-full",
            rose ? "text-success" : "text-destructive"
          )}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
            className="size-full"
          >
            <defs>
              <linearGradient id="rate-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines sit in their own group so they take the border colour
                rather than the line's green or red. */}
            <g className="text-border">
              {[TOP, (TOP + BOTTOM) / 2, BOTTOM].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>

            <path d={area} fill="url(#rate-fill)" />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatMonth(points[0].date)}</span>
          <span>{formatMonth(points[points.length - 1].date)}</span>
        </div>
      </div>
    </div>
  )
}
