"use client"

import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { WorkspaceArchitecture } from "@/components/landing/workspace-architecture"

export function PageTour() {
  return (
    <section id="pages" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="The workspace"
        title="Eight surfaces, one ledger"
      />

      <Reveal delay={120} y={20}>
        <WorkspaceArchitecture />
      </Reveal>
    </section>
  )
}
