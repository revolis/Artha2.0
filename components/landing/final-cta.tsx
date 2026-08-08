"use client"

import Link from "next/link"

import { ArrowRight } from "@/components/icons"
import { Reveal } from "@/components/landing/reveal"
import { Button } from "@/components/ui/button"
import { MagnetizeButton } from "@/components/ui/magnetize-button"

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16">
      <Reveal y={24}>
        {/* Translucent rather than solid, so the site-wide star field carries
            on through the panel instead of a second one being drawn inside it. */}
        <div className="overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-[2px]">
          <div className="relative flex flex-col items-center gap-5 px-6 py-20 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              Start with the demo. Decide from there.
            </h2>
            <p className="max-w-lg leading-relaxed text-balance text-muted-foreground">
              The workspace opens on a full year of activity, every control
              live. Change the display currency, interrogate the charts, add an
              entry of your own — then create an account when you are ready to
              keep your own.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                render={<Link href="/dashboard" />}
                nativeButton={false}
              >
                Explore the live demo
                <ArrowRight data-icon="inline-end" />
              </Button>
              <MagnetizeButton
                size="lg"
                render={<Link href="/signup" />}
                nativeButton={false}
              >
                Create an account
              </MagnetizeButton>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
