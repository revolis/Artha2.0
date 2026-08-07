"use client"

import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import DataFeedingIn from "@/components/ui/data-feeding-in"

const STEPS = [
  {
    n: "01",
    title: "Record",
    body: "Log the entry while it is fresh.",
  },
  {
    n: "02",
    title: "Resolve",
    body: "Totals, charts and targets update on save.",
  },
  {
    n: "03",
    title: "Review",
    body: "Measure the distance to your target.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="The method"
        title="Three habits. The rest resolves itself."
      />

      {/* Both columns take min-w-0: the illustration is a fixed 400px, and a
          grid item defaults to min-width:auto, so it would otherwise set the
          column width and push the steps past the viewport on a phone. */}
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="min-w-0">
          <ol className="flex flex-col">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="flex items-baseline gap-5 border-b py-6 last:border-b-0"
              >
                <span className="text-xs font-medium tracking-[0.18em] text-[var(--chart-2)] tabular-nums">
                  {step.n}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg font-semibold">{step.title}</span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={140} className="min-w-0">
          {/* Pulses travelling along converging paths into a ledger table.
              Scaled down on a phone, and clipped by the wrapper beyond that. */}
          <div className="flex w-full justify-center overflow-hidden lg:justify-end">
            <div className="shrink-0 scale-[0.78] sm:scale-100">
              <DataFeedingIn />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
