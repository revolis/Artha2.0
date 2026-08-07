"use client"

import { WavyBlock, WavyBlockItem } from "@/components/ui/wavy-text-block"

// The six things a ledger entry can be. Scrolling past sets them swaying,
// each line a little out of phase with the one above it.
const LINES = ["PROFIT", "LOSS", "CONVERSIONS", "FEES", "TAX", "TRANSFERS"]

export function WavyBand() {
  return (
    <section
      aria-label="What a ledger entry can be"
      className="overflow-hidden border-y bg-muted/20 py-20"
    >
      <WavyBlock className="flex flex-col gap-1">
        {LINES.map((line, index) => (
          <WavyBlockItem
            key={line}
            index={index}
            className="text-3xl leading-[1.05] font-semibold tracking-tight whitespace-nowrap text-muted-foreground/35 select-none sm:text-5xl"
          >
            {line}
          </WavyBlockItem>
        ))}
      </WavyBlock>
    </section>
  )
}
