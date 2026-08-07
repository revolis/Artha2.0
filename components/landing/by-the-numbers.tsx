"use client"

import * as React from "react"

import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number"
import { Reveal } from "@/components/landing/reveal"
import { demoLedger } from "@/lib/landing-stats"
import { useInView } from "@/lib/use-in-view"

const FIGURES: { value: number; label: string; sub: string }[] = [
  {
    value: demoLedger.entries,
    label: "entries",
    sub: "loaded and ready",
  },
  {
    value: demoLedger.years,
    label: "years",
    sub: "of history to page through",
  },
  {
    value: demoLedger.categories,
    label: "categories",
    sub: "of income and cost",
  },
  {
    value: demoLedger.sources,
    label: "sources",
    sub: "exchanges, brokers, people",
  },
  { value: demoLedger.activeDays, label: "active days", sub: "on the heatmap" },
  {
    value: demoLedger.currencies,
    label: "currencies",
    sub: "to display totals in",
  },
]

/**
 * Whether a ResizeObserver actually delivers a callback here.
 *
 * The sliding number sizes its digit reels by measuring them, so where the
 * observer exists but never fires, every figure renders blank. Checking that
 * the constructor is defined isn't enough — this waits for a real callback and
 * only then lets the animated version mount.
 */
function useMeasurementWorks(): boolean {
  const [works, setWorks] = React.useState(false)

  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined") return
    const probe = document.createElement("div")
    probe.style.cssText = "position:absolute;width:10px;height:10px;opacity:0"
    document.body.appendChild(probe)

    let done = false
    const observer = new ResizeObserver(() => {
      if (done) return
      done = true
      setWorks(true)
    })
    observer.observe(probe)

    const timer = window.setTimeout(() => {
      done = true
    }, 500)

    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
      probe.remove()
    }
  }, [])

  return works
}

function Figure({
  value,
  label,
  sub,
  start,
  delay,
}: {
  value: number
  label: string
  sub: string
  start: boolean
  delay: number
}) {
  const animated = useMeasurementWorks()

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-3xl font-semibold tabular-nums sm:text-4xl">
        {/* Counts up from zero the first time the strip is scrolled to. Before
            that — and anywhere the reels can't measure themselves — the plain
            figure stands in, so a number is never missing. */}
        {start && animated ? (
          <SlidingNumber number={value} fromNumber={0} delay={delay} />
        ) : (
          value.toLocaleString()
        )}
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {sub}
      </span>
    </div>
  )
}

export function ByTheNumbers() {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref)

  return (
    <section className="border-y bg-muted/20">
      <div
        ref={ref}
        className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-5 py-14 sm:grid-cols-3 lg:grid-cols-6"
      >
        {FIGURES.map((figure, index) => (
          <Reveal key={figure.label} delay={index * 60} y={12}>
            <Figure {...figure} start={inView} delay={index * 80} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
