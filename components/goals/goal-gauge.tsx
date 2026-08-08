"use client"

import * as React from "react"
import NumberFlow from "@number-flow/react"

import { createNotchPath } from "@/components/charts/notch-gauge-shared"
import { getGoalRawPercent, getGoalSlices, type GoalSlice } from "@/lib/goals"
import type { Currency, Goal } from "@/lib/types"
import { useMoney } from "@/lib/use-money"
import { cn } from "@/lib/utils"

// Arc geometry follows @bklit/gauge-chart's notch gauge: same sweep, taper and
// filleted corners. Drawn here rather than with <Gauge> because that component
// fills a single active run, and a goal needs three independent parts that can
// each be hovered.
const START_ANGLE = 140
const END_ANGLE = 400
const TOTAL_NOTCHES = 44
const SPACING = 0 // percent of the sweep given over to gaps
const CORNER_RADIUS = 7

// Internal drawing units. The sweep runs 140°→400°, which spans the full width
// but only reaches 0.64r below centre, so ~0.82 is the arc's natural ratio.
const VIEW_W = 260
const VIEW_H = 213

type SliceKey = GoalSlice["key"]

export const SLICE_FILL: Record<SliceKey, string> = {
  completed: "var(--chart-1)",
  remaining: "var(--border)",
  exceed: "var(--success)",
}

/**
 * False on the server and for the first client render, true straight after —
 * gives NumberFlow a 0 to count up from without touching state in an effect.
 */
function useHasMounted() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    // A timer rather than a bare setState so the first paint is committed
    // before the number starts moving.
    const timer = window.setTimeout(() => setMounted(true), 60)
    return () => window.clearTimeout(timer)
  }, [])
  return mounted
}

interface NotchDatum {
  index: number
  slice: SliceKey
  path: string
  cx: number
  cy: number
}

/** Splits the arc into runs of notches, one run per slice. */
function assignNotches(slices: GoalSlice[], rawPercent: number): SliceKey[] {
  // The arc spans the whole target, or the whole achievement when overshot.
  const scale = Math.max(100, rawPercent)
  const order: SliceKey[] = ["completed", "remaining", "exceed"]

  const counts = new Map<SliceKey, number>()
  let assigned = 0
  for (const key of order) {
    const slice = slices.find((item) => item.key === key)
    if (!slice) continue
    const count = Math.round((slice.percent / scale) * TOTAL_NOTCHES)
    counts.set(key, count)
    assigned += count
  }

  // Rounding can leave the arc a notch short or long; settle it on the part
  // that owns the most ground.
  if (assigned !== TOTAL_NOTCHES) {
    const biggest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    if (biggest) counts.set(biggest[0], biggest[1] + (TOTAL_NOTCHES - assigned))
  }

  const out: SliceKey[] = []
  for (const key of order) {
    const count = counts.get(key) ?? 0
    for (let i = 0; i < count; i += 1) out.push(key)
  }
  return out.slice(0, TOTAL_NOTCHES)
}

/**
 * NumberFlow is a custom element, so it can't render until the browser has
 * registered it. Same guard ChartStatFlow uses for the pie centre — a plain
 * formatted string stands in until then, so no frame shows a wrong number.
 */
function useNumberFlowReady(): boolean {
  // Always false for the server render *and* the hydrating one — reading
  // customElements in the initialiser would make the two disagree.
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (typeof customElements === "undefined") return
    let cancelled = false
    customElements.whenDefined("number-flow-react").then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return ready
}

function GaugeCenter({
  amount,
  percent,
  label,
  currency,
  target,
  masked,
}: {
  amount: number
  percent: number
  label: string
  currency: Currency
  target: Currency
  masked: boolean
}) {
  const ready = useNumberFlowReady()
  const { convert } = useMoney()
  const shown = convert(amount, currency, target)

  const moneyFormat = {
    style: "currency" as const,
    currency: target,
    maximumFractionDigits: 0,
  }
  const percentFormat = {
    style: "percent" as const,
    maximumFractionDigits: 1,
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[22%] text-center">
      <span className="text-xl font-bold text-foreground tabular-nums sm:text-2xl">
        {masked ? (
          "••••••"
        ) : ready ? (
          <NumberFlow value={shown} format={moneyFormat} isolate willChange />
        ) : (
          new Intl.NumberFormat(undefined, moneyFormat).format(shown)
        )}
      </span>
      <span className="mt-1 flex items-baseline gap-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">
          {ready ? (
            <NumberFlow
              value={percent / 100}
              format={percentFormat}
              isolate
              willChange
            />
          ) : (
            new Intl.NumberFormat(undefined, percentFormat).format(
              percent / 100
            )
          )}
        </span>
        <span className="truncate">{label}</span>
      </span>
    </div>
  )
}

/**
 * Goal progress as a notched arc in three parts — completed, remaining, and
 * the overshoot once the target is beaten. Hovering a part lifts it, fades the
 * others, and counts the centre through to that part's own figures.
 */
export function GoalGauge({
  goal,
  hovered,
  onHoverChange,
  className,
}: {
  goal: Goal
  /** Controlled by the card so the legend and the arc light up together. */
  hovered: SliceKey | null
  onHoverChange: (slice: SliceKey | null) => void
  className?: string
}) {
  // Read through the hook rather than module state: it hands back the seed
  // values during hydration, so server and client agree on the first render
  // and the stored settings arrive on the next one.
  const { displayCurrency, privacyMode } = useMoney()
  const mounted = useHasMounted()

  const rawPercent = getGoalRawPercent(goal)
  const slices = React.useMemo(() => getGoalSlices(goal), [goal])
  const sliceByKey = React.useMemo(
    () => new Map(slices.map((slice) => [slice.key, slice])),
    [slices]
  )

  const assignment = React.useMemo(
    () => assignNotches(slices, rawPercent),
    [slices, rawPercent]
  )

  const notches = React.useMemo<NotchDatum[]>(() => {
    const size = Math.min(VIEW_W, VIEW_H)
    const centerX = VIEW_W / 2
    const centerY = VIEW_H / 2
    const outerRadius = size * 0.46
    const innerRadius = outerRadius - size * 0.15

    const totalAngle = END_ANGLE - START_ANGLE
    const availableAngle = totalAngle * (1 - SPACING / 100)
    const notchAngle = availableAngle / TOTAL_NOTCHES
    const gapAngle =
      TOTAL_NOTCHES > 1
        ? (totalAngle * (SPACING / 100)) / (TOTAL_NOTCHES - 1)
        : 0

    return Array.from({ length: TOTAL_NOTCHES }, (_, i) => {
      const angle = START_ANGLE + i * (notchAngle + gapAngle) + notchAngle / 2
      const radians = (angle * Math.PI) / 180
      const halfWidth = (notchAngle * 0.8 * Math.PI) / 180 / 2

      const points = {
        x1: centerX + Math.cos(radians - halfWidth) * outerRadius,
        y1: centerY + Math.sin(radians - halfWidth) * outerRadius,
        x2: centerX + Math.cos(radians + halfWidth) * outerRadius,
        y2: centerY + Math.sin(radians + halfWidth) * outerRadius,
        x3: centerX + Math.cos(radians + halfWidth) * innerRadius,
        y3: centerY + Math.sin(radians + halfWidth) * innerRadius,
        x4: centerX + Math.cos(radians - halfWidth) * innerRadius,
        y4: centerY + Math.sin(radians - halfWidth) * innerRadius,
      }

      const midRadius = (outerRadius + innerRadius) / 2
      return {
        index: i,
        slice: assignment[i] ?? "remaining",
        path: createNotchPath(points, CORNER_RADIUS, outerRadius - innerRadius),
        cx: centerX + Math.cos(radians) * midRadius,
        cy: centerY + Math.sin(radians) * midRadius,
      }
    })
  }, [assignment])

  // Where the floating label sits: over the middle notch of the hovered part.
  const anchor = React.useMemo(() => {
    if (!hovered) return null
    const own = notches.filter((notch) => notch.slice === hovered)
    if (own.length === 0) return null
    const mid = own[Math.floor(own.length / 2)]
    return { x: mid.cx, y: mid.cy }
  }, [hovered, notches])

  const activeSlice = hovered ? sliceByKey.get(hovered) : undefined
  const centerAmount = activeSlice ? activeSlice.amount : goal.currentAmount
  const centerPercent = activeSlice ? activeSlice.percent : rawPercent
  const centerLabel = activeSlice
    ? activeSlice.key === "exceed"
      ? "over target"
      : activeSlice.key === "remaining"
        ? "still to go"
        : "of target"
    : "achieved"

  return (
    <div
      // Fixed viewBox scaled by CSS — no measuring, so nothing can render at
      // zero size before a resize lands. The aspect ratio matches the viewBox
      // exactly, which keeps the floating label's percentage position true.
      className={cn(
        "relative mx-auto w-full max-w-[188px]",
        "aspect-[260/213]",
        className
      )}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 size-full"
        role="img"
        aria-label={`${goal.title}: ${Math.round(rawPercent)}% of target`}
      >
        {notches.map((notch) => {
          const dimmed = hovered !== null && hovered !== notch.slice
          return (
            <path
              key={notch.index}
              d={notch.path}
              fill={SLICE_FILL[notch.slice]}
              className={cn(
                "cursor-pointer transition-[opacity,transform] duration-300 ease-out",
                // A short stagger so the arc draws itself in on load.
                !mounted && "opacity-0"
              )}
              style={{
                opacity: !mounted
                  ? 0
                  : dimmed
                    ? 0.18
                    : // The unfilled track sits back a little, but comes
                      // fully forward when it is the part being pointed at.
                      notch.slice === "remaining" && hovered !== "remaining"
                      ? 0.85
                      : 1,
                transitionDelay: mounted ? undefined : `${notch.index * 12}ms`,
                transformBox: "fill-box",
                transformOrigin: "center",
              }}
              onMouseEnter={() => onHoverChange(notch.slice)}
              onMouseLeave={() => onHoverChange(null)}
            />
          )
        })}
      </svg>

      <GaugeCenter
        amount={mounted ? centerAmount : 0}
        percent={mounted ? centerPercent : 0}
        label={centerLabel}
        currency={goal.currency}
        target={displayCurrency}
        masked={privacyMode}
      />

      {/* Floating label for the hovered part. */}
      {activeSlice && anchor ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 animate-in rounded-lg border bg-popover px-2.5 py-1.5 text-center shadow-md duration-150 fade-in-0 zoom-in-95"
          style={{
            left: `${(anchor.x / VIEW_W) * 100}%`,
            top: `${(anchor.y / VIEW_H) * 100}%`,
          }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: SLICE_FILL[activeSlice.key] }}
            />
            {activeSlice.label}
          </div>
          <div className="text-[11px] text-muted-foreground tabular-nums">
            {activeSlice.percent.toFixed(activeSlice.percent < 10 ? 1 : 0)}%
          </div>
        </div>
      ) : null}
    </div>
  )
}
