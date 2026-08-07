"use client"

import * as React from "react"
import NumberFlow from "@number-flow/react"
import {
  CalendarRange,
  Layers,
  ListChecks,
  Store,
  Target,
  type AppIcon,
} from "@/components/icons"

import { useInView } from "@/lib/use-in-view"

export interface ActivityStat {
  label: string
  /** Numbers count up; a string (like a date) just fades in. */
  value: number | string
  suffix?: string
  sub: string
  icon: AppIcon
}

/**
 * NumberFlow is a custom element, so it can't render on the server. Same guard
 * the chart centres use — a plain formatted number stands in until then.
 */
function useNumberFlowReady(): boolean {
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

function StatTile({ stat, shown }: { stat: ActivityStat; shown: boolean }) {
  const ready = useNumberFlowReady()
  const isNumber = typeof stat.value === "number"

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 transition-all duration-500 ease-out"
      // Driven by state rather than a CSS delay: the stagger comes from
      // timers, so a browser that skips the transition still lands on the
      // visible state instead of holding the tile at zero.
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(12px)",
      }}
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-background text-muted-foreground">
        <stat.icon className="size-3.5" />
      </span>

      <span className="text-xs text-muted-foreground">{stat.label}</span>

      <span className="text-xl leading-none font-semibold tabular-nums">
        {isNumber ? (
          <>
            {ready ? (
              <NumberFlow
                value={shown ? (stat.value as number) : 0}
                isolate
                willChange
              />
            ) : (
              (stat.value as number).toLocaleString()
            )}
            {stat.suffix}
          </>
        ) : (
          stat.value
        )}
      </span>

      <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {stat.sub}
      </span>
    </div>
  )
}

/**
 * Compact strip of account activity figures. The tiles lift into place and the
 * numbers count up the first time the section is scrolled to.
 */
export function ActivityStats({ stats }: { stats: ActivityStat[] }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const [revealed, setRevealed] = React.useState(0)

  // Tiles arrive one at a time once the section is reached. Timers rather
  // than CSS delays, so the stagger happens even where animations don't.
  React.useEffect(() => {
    if (!inView) return
    const timers = stats.map((_, index) =>
      window.setTimeout(
        () => setRevealed((count) => Math.max(count, index + 1)),
        index * 90
      )
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [inView, stats])

  return (
    <div
      ref={ref}
      className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5"
      aria-label="Account activity"
    >
      {stats.map((stat, index) => (
        <StatTile key={stat.label} stat={stat} shown={index < revealed} />
      ))}
    </div>
  )
}

export const ACTIVITY_ICONS = {
  memberSince: CalendarRange,
  entries: ListChecks,
  years: Layers,
  sources: Store,
  goals: Target,
}
