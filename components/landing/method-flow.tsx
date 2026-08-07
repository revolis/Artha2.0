"use client"

import * as React from "react"
import { motion, useAnimation } from "motion/react"

import { Reveal } from "@/components/landing/reveal"

// Converging paths, adapted from @gammaui/data-feeding-in. Seven strands run
// in from the left and gather at the right; the block is rotated a quarter
// turn so they arrive at the top of the panel below.
const PATHS = [
  "M0 100H55.022C61.8914 100 68.6451 101.769 74.6324 105.137L120.368 130.863C126.355 134.231 133.109 136 139.978 136H201.5",
  "M0 60H48.2171C59.2463 60 69.7861 64.5539 77.3451 72.5854L117.655 115.415C125.214 123.446 135.754 128 146.783 128H201.5",
  "M0 188H55.022C61.8914 188 68.6451 186.231 74.6324 182.863L120.368 157.137C126.355 153.769 133.109 152 139.978 152H201.5",
  "M0 228H48.2171C59.2463 228 69.7861 223.446 77.3451 215.415L117.655 172.585C125.214 164.554 135.754 160 146.783 160H201.5",
  "M0 287H41.7852C56.4929 287 70.0142 278.929 76.994 265.983L118.49 189.017C125.47 176.071 138.991 168 153.699 168H202",
  "M0 144L201 145",
  "M0 1H41.5946C56.3171 1 69.8495 9.08744 76.823 22.0537L118.177 98.9463C125.15 111.913 138.683 120 153.405 120H201.5",
]

/** Width of the SVG's user-space coordinate system. */
const VIEW_W = 202

const STEPS = [
  { n: "01", title: "Record", body: "Log the entry while it is fresh." },
  {
    n: "02",
    title: "Resolve",
    body: "Totals, charts and targets update on save.",
  },
  { n: "03", title: "Review", body: "Measure the distance to your target." },
]

function ConvergingFeed() {
  const controls = useAnimation()

  React.useEffect(() => {
    // User-space numbers, not percentages: the gradient is declared with
    // gradientUnits="userSpaceOnUse", where a percentage is not a valid length.
    controls.start({
      x1: [-VIEW_W, VIEW_W * 2],
      x2: [0, VIEW_W * 3],
      transition: {
        duration: 1.6,
        ease: "linear",
        repeat: Infinity,
        delay: 0.25,
      },
    })
  }, [controls])

  return (
    <div
      aria-hidden
      className="h-20 origin-right text-foreground"
      style={{ transform: "rotate(90deg) translateX(40px)" }}
    >
      <svg width={VIEW_W} className="ml-auto" viewBox="0 0 202 288" fill="none">
        {PATHS.map((d, index) => (
          <React.Fragment key={d}>
            <path
              d={d}
              stroke="currentColor"
              mask="url(#method-mask)"
              strokeLinecap="round"
              strokeOpacity="0.2"
              strokeWidth="2"
              strokeDasharray="0.1 3"
            />
            <path
              d={d}
              stroke={`url(#method-pulse-${index})`}
              strokeLinecap="round"
              strokeWidth="2"
              strokeDasharray="0.1 3"
              mask="url(#method-mask)"
            />
          </React.Fragment>
        ))}
        <defs>
          <linearGradient
            id="method-mask-grad"
            x1="202"
            y1="227"
            x2="32"
            y2="227"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="method-mask" maskUnits="userSpaceOnUse">
            <rect width="202" height="288" fill="url(#method-mask-grad)" />
          </mask>
          {PATHS.map((d, index) => (
            <motion.linearGradient
              key={d}
              id={`method-pulse-${index}`}
              y1="0"
              y2="0"
              gradientUnits="userSpaceOnUse"
              // Through `initial` so motion has a defined starting value —
              // otherwise it writes `undefined` on the first frame.
              initial={{ x1: -VIEW_W, x2: 0 }}
              animate={controls}
            >
              <stop offset="0.35" stopColor="var(--chart-2)" stopOpacity="0" />
              <stop offset="0.45" stopColor="var(--chart-2)" />
              <stop offset="0.55" stopColor="var(--chart-2)" />
              <stop offset="0.65" stopColor="var(--chart-2)" stopOpacity="0" />
            </motion.linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  )
}

/**
 * The three steps sitting inside the panel the feed runs into, so the diagram
 * and the method are one object rather than two things side by side.
 *
 * The rows reveal on a timer rather than through motion's initial/animate:
 * these are the section's actual content, and content that depends on an
 * animation frame arriving is content that can fail to appear at all.
 */
export function MethodFlow() {
  return (
    <div className="flex flex-col items-center">
      <ConvergingFeed />

      <div className="w-full max-w-md overflow-hidden rounded-xl border bg-card/60 backdrop-blur-[2px]">
        <div aria-hidden className="flex gap-1.5 border-b px-4 py-3">
          <span className="size-2 rounded-full bg-muted-foreground/25" />
          <span className="size-2 rounded-full bg-muted-foreground/25" />
          <span className="size-2 rounded-full bg-muted-foreground/25" />
        </div>

        <ol className="flex flex-col">
          {STEPS.map((step, index) => (
            <li key={step.n} className="border-b last:border-b-0">
              <Reveal delay={200 + index * 160} y={10}>
                <div className="flex items-baseline gap-4 px-4 py-5">
                  <span className="text-xs font-medium tracking-[0.18em] text-[var(--chart-2)] tabular-nums">
                    {step.n}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-semibold">{step.title}</span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </span>
                  </span>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
