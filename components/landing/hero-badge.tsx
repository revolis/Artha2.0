"use client"

// The line above the headline.
//
// It used to read "Crypto, equities and cash income in a single ledger" — a
// list of file types, which describes the input rather than what anyone gets
// out of it. Three lines take turns instead, each saying what the ledger is
// for rather than what goes into it.
//
// The rotation is a vertical roll, not a fade. Nothing here ever drops to
// zero opacity: the stack slides inside a one-line window, so if the
// transition cannot run — reduced motion, or a browser that is not
// compositing — the badge still shows a whole, readable line rather than
// nothing at all.
//
// The width is held by an invisible copy of the longest line. Without it the
// pill would resize on every change, and something that twitches every three
// seconds reads as cheap rather than considered.

import * as React from "react"

import { Gem } from "@/components/icons"
import { cn } from "@/lib/utils"

const PHRASES = [
  "One ledger for everything you own",
  "Every gain, loss and fee accounted for",
  "Your true position, in your currency",
] as const

// Long enough to read twice without rushing, short enough that a visitor
// sees more than one before they scroll.
const INTERVAL_MS = 3000

export function HeroBadge({ className }: { className?: string }) {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const id = setInterval(
      () => setIndex((value) => (value + 1) % PHRASES.length),
      INTERVAL_MS
    )
    return () => clearInterval(id)
  }, [])

  const longest = PHRASES.reduce((a, b) => (b.length > a.length ? b : a))

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border bg-card/60 py-1.5 pr-4 pl-1.5 text-xs text-muted-foreground backdrop-blur",
        className
      )}
    >
      {/* The mark sits in its own tinted chip rather than floating bare
          against the pill — a small thing that reads as finished.
          --glow-sweep rather than --chart-2: the accent gold scores 2.3
          against this chip in the light theme against 7.8 in the dark one,
          because a light gold on a near-white chip has no contrast to
          spend. In the dark theme the two tokens are the same colour. */}
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--glow-sweep)]/30 bg-[var(--glow-sweep)]/10"
      >
        <Gem className="size-3 text-[var(--glow-sweep)]" />
      </span>

      <span className="relative block overflow-hidden">
        {/* Sizer: occupies space, shows nothing. */}
        <span aria-hidden className="invisible block whitespace-nowrap">
          {longest}
        </span>
        <span
          className="absolute inset-0 transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateY(-${index * 100}%)` }}
        >
          {PHRASES.map((phrase, i) => (
            <span
              key={phrase}
              // Only the line in the window is offered to a screen reader, so
              // the badge reads as one sentence rather than three.
              aria-hidden={i !== index}
              className="block whitespace-nowrap"
            >
              {phrase}
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}
