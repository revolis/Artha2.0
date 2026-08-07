"use client"

import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"

const STEPS = [
  {
    n: "01",
    title: "Log what happened",
    body: "An airdrop landed, a trade went wrong, the exchange took a fee, you sold USD for rupees. Pick the type, put in the amount, add a category and a note while you still remember.",
  },
  {
    n: "02",
    title: "Let it add up",
    body: "Every page reads from the same ledger. The portfolio line, the monthly bars, the category split, the heatmap and the year totals all move the moment you save an entry.",
  },
  {
    n: "03",
    title: "Watch the year close",
    body: "Set a target, pin it to the dashboard, and see how far along you are — including how far past it you went. Export the year when it's time to file.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="How it works"
        title="Three habits, and the rest takes care of itself"
        description="There's no import, no bank connection and no syncing to wait for. The only work is the minute it takes to write an entry down."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal key={step.n} delay={index * 110} className="h-full">
            <div className="relative flex h-full flex-col gap-3 rounded-xl border bg-card p-6">
              {/* The step number sits behind the text as a watermark. */}
              <span
                aria-hidden
                className="absolute top-4 right-5 text-5xl font-semibold text-muted-foreground/10 tabular-nums select-none"
              >
                {step.n}
              </span>
              <span className="text-[10px] font-medium tracking-[0.2em] text-[var(--chart-2)] uppercase">
                Step {step.n}
              </span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
