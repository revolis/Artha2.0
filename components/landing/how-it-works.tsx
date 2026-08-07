"use client"

import { MethodFlow } from "@/components/landing/method-flow"
import { SectionHeading } from "@/components/landing/section-heading"

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="The method"
        title="Three habits. The rest resolves itself."
      />

      <MethodFlow />
    </section>
  )
}
