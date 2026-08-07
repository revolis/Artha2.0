"use client"

import Link from "next/link"

import { ArrowRight, Sparkles } from "@/components/icons"
import { Reveal } from "@/components/landing/reveal"
import { Button } from "@/components/ui/button"
import { DotPattern } from "@/components/ui/dot-pattern"
import { demoLedger } from "@/lib/landing-stats"
import { cn } from "@/lib/utils"

const CAPABILITIES = [
  "Six entry types",
  "Six display currencies",
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
          <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-[var(--chart-2)]" />
            Crypto, equities and cash income in a single ledger
          </span>
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
            A precision dashboard for people who want their own numbers, not an
            estimate. Record what you earned, lost, paid in fees and converted
            to cash — and see your portfolio, your goals and your year resolve
            in rupees and dollars at the day&apos;s rate.
          </p>
        </Reveal>

        <Reveal delay={440}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              Explore the live demo
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="#dashboard" />}
              nativeButton={false}
            >
              Tour the workspace
            </Button>
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

        <Reveal delay={620}>
          <p className="text-xs text-muted-foreground/70">
            The demo opens on a working ledger of {demoLedger.entries} entries
            spanning {demoLedger.firstYear}–{demoLedger.lastYear}.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
