"use client"

import { HeroBadge } from "@/components/landing/hero-badge"
import { LiveDemoButton } from "@/components/landing/live-demo-button"
import { Reveal } from "@/components/landing/reveal"
import { DotPattern } from "@/components/ui/dot-pattern"
import { cn } from "@/lib/utils"

// Framed as what you can do, not how many of it there is. A count tells a
// visitor nothing until they already know the product.
const CAPABILITIES = [
  "Record entries however you work",
  "Read your totals in any currency",
  "Exchange rates refreshed daily",
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Dots fade towards the edges so the grid never draws a hard box. */}
      <DotPattern
        cr={0.8}
        className={cn(
          "absolute inset-0 h-full w-full text-muted-foreground/50",
          "[mask-image:radial-gradient(420px_circle_at_center_top,white,transparent)]"
        )}
      />
      {/* A single warm bloom behind the headline, in the accent the charts use. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "var(--chart-2)" }}
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-7 px-5 pt-20 pb-16 text-center sm:pt-28">
        <Reveal delay={40} y={10}>
          <HeroBadge />
        </Reveal>

        <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
          <Reveal delay={120} y={18}>
            <span className="block">Know exactly where</span>
          </Reveal>
          <Reveal delay={220} y={18}>
            <span className="block">your money stands.</span>
          </Reveal>
        </h1>

        <Reveal delay={340}>
          <p className="max-w-2xl text-base leading-relaxed text-balance text-muted-foreground sm:text-lg">
            Artha brings your everyday income/expenses into a single ledger.
            Record each gain, loss, fee and conversion as it happens, and see
            your true position — in the currency you work in, at the day&apos;s
            rate.
          </p>
        </Reveal>

        {/* One call to action. "See it in action" sat beside this and pointed
            further down the same page, which asked the reader to choose
            between seeing the product and seeing a picture of it. */}
        <Reveal delay={440}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LiveDemoButton />
          </div>
        </Reveal>

        <Reveal delay={540}>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {CAPABILITIES.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-1 rounded-full bg-[var(--chart-2)]"
                />
                {item}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
