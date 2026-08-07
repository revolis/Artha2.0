"use client"

import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"

const STEPS = [
  {
    n: "01",
    title: "Record it while it is fresh",
    body: "An allocation lands, a position closes short, a platform takes its cut, dollars become rupees. Choose the type, enter the amount, attach a category and a note — a minute at most.",
  },
  {
    n: "02",
    title: "Let the totals resolve",
    body: "Every surface reads from the same ledger. The portfolio series, the monthly bars, the category split, the heatmap and the annual totals all move the moment an entry is saved.",
  },
  {
    n: "03",
    title: "Hold yourself to the number",
    body: "Set a target, pin it to the year it belongs to, and track the distance to it — overshoot included. Export the period when it is time to file.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="The method"
        title="Three habits. The rest resolves itself."
        description="Precision costs about a minute a day. Everything downstream of that minute — the totals, the trends, the targets — is computed for you."
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
