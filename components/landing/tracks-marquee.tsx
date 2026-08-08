"use client"

import * as React from "react"

import Marquee from "@/components/ui/marquee/marquee"
import { getCategoryIcon } from "@/lib/category-icons"

// What the ledger is for, rather than who or what it happens to be full of.
// Naming the exchanges and the people traded with told a visitor nothing and
// dated the page the moment either changed.
const EARNINGS = [
  "Income Sources",
  "Spot Trading",
  "Perpetual Trading",
  "Futures Trading",
  "Stocks",
  "US Stocks",
  "Commodities",
  "Dividends",
  "Staking Rewards",
  "Airdrops",
  "Freelance Income",
  "Referral Income",
  "Interest & Yield",
  "Prediction Markets",
]

const OUTGOINGS = [
  "Expenses",
  "Monthly Expenses",
  "Travel Expenses",
  "Tax",
  "Capital Gains Tax",
  "Platform Fees",
  "Network Fees",
  "Withdrawal Fees",
  "Subscriptions",
  "Cash Conversions",
  "Realised Losses",
  "Transfers",
]

function Pill({ label }: { label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border bg-card/70 px-3.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground">
      {/* createElement rather than a capitalised local: the icon is looked up
          from a cache, not defined here. */}
      {React.createElement(getCategoryIcon(label), { className: "size-3.5" })}
      {label}
    </span>
  )
}

function Row({ items }: { items: string[] }) {
  return (
    <div className="flex items-center gap-3">
      {items.map((item) => (
        <Pill key={item} label={item} />
      ))}
    </div>
  )
}

/**
 * What Artha keeps track of, drifting past in both directions: what comes in
 * on the top row, what goes out on the bottom.
 *
 * `repeat` is a fixed number rather than "auto" — auto measures with a
 * ResizeObserver, and a strip that renders nothing when the observer is
 * unavailable is not worth the tighter loop.
 */
export function TracksMarquee() {
  return (
    <section
      aria-label="What Artha keeps track of"
      className="relative flex flex-col gap-3 overflow-hidden border-y bg-muted/20 py-10"
    >
      {/* Fades the strip into the page at both ends. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent"
      />

      <Marquee speed={26} gap="0.75rem" repeat={3} pauseOnHover>
        <Row items={EARNINGS} />
      </Marquee>
      <Marquee
        speed={20}
        gap="0.75rem"
        repeat={4}
        direction="right"
        pauseOnHover
      >
        <Row items={OUTGOINGS} />
      </Marquee>
    </section>
  )
}
