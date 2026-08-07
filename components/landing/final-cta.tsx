"use client"

import Link from "next/link"

import { ArrowRight, ListChecks } from "@/components/icons"
import { Reveal } from "@/components/landing/reveal"
import { Button } from "@/components/ui/button"
import { DotPattern } from "@/components/ui/dot-pattern"
import { cn } from "@/lib/utils"

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16">
      <Reveal y={24}>
        <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-16 text-center">
          <DotPattern
            cr={0.8}
            className={cn(
              "absolute inset-0 h-full w-full text-muted-foreground/50",
              "[mask-image:radial-gradient(320px_circle_at_center,white,transparent)]"
            )}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-1/2 size-96 -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl"
            style={{ background: "var(--chart-2)" }}
          />

          <div className="relative flex flex-col items-center gap-5">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              Have a look around. Nothing to sign, nothing to install.
            </h2>
            <p className="max-w-lg leading-relaxed text-balance text-muted-foreground">
              The demo opens on a full year of entries. Change the currency,
              hover the charts, add an entry of your own — it&apos;s the whole
              application, not a walkthrough.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                render={<Link href="/dashboard" />}
                nativeButton={false}
              >
                Open the live demo
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/entries" />}
                nativeButton={false}
              >
                <ListChecks data-icon="inline-start" />
                Browse the ledger
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
