"use client"

import * as React from "react"
import Link from "next/link"

import { ArrowRight } from "@/components/icons"
import { PortfolioCard } from "@/components/dashboard/portfolio-card"
import { GoalCard } from "@/components/goals/goal-card"
import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { Button } from "@/components/ui/button"
import { DEMO_YEAR } from "@/lib/landing-stats"
import { mockEntries, mockGoals } from "@/lib/mock-data"
import {
  buildDualDailySeries,
  getMonthOverMonth,
  getPortfolioStats,
} from "@/lib/portfolio"

/** The frame around the preview, so it reads as the app and not as page furniture. */
function WindowFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/5">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        </span>
        <span className="mx-auto rounded-md bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
          artha.app/dashboard
        </span>
      </div>
      <div className="flex flex-col gap-4 bg-background p-4 sm:p-6">
        {children}
      </div>
    </div>
  )
}

/**
 * The preview mounts the application's own dashboard components against the
 * demo ledger rather than showing an exported image, so it stays in step with
 * the product and stays interactive for the visitor.
 */
export function DashboardPreview() {
  const series = React.useMemo(
    () => buildDualDailySeries(mockEntries, DEMO_YEAR),
    []
  )
  const momentum = React.useMemo(() => getMonthOverMonth(series), [series])
  const grossMomentum = React.useMemo(
    () => getMonthOverMonth(series, "netIncome"),
    [series]
  )
  const stats = React.useMemo(
    () => getPortfolioStats(mockEntries, DEMO_YEAR),
    []
  )

  const pinned = mockGoals
    .filter(
      (goal) =>
        goal.showOnDashboard && goal.startDate?.startsWith(String(DEMO_YEAR))
    )
    .slice(0, 2)

  return (
    <section id="dashboard" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="The dashboard"
        title="Your year, resolved to the rupee"
        description="Portfolio value before and after the cash you've taken out, month-on-month movement, and the targets you're measuring yourself against — interactive, and running on a live ledger."
      />

      <Reveal delay={120} y={24}>
        <WindowFrame>
          <PortfolioCard
            series={series}
            momentum={momentum}
            grossMomentum={grossMomentum}
            netIncome={stats.netIncome}
            cashOut={stats.cashOut}
            cashIn={stats.cashIn}
          />
          {pinned.length > 0 ? (
            <div className="mx-auto grid w-full max-w-2xl gap-4 sm:grid-cols-2">
              {pinned.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : null}
        </WindowFrame>
      </Reveal>

      <Reveal delay={220}>
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            render={<Link href="/dashboard" />}
            nativeButton={false}
          >
            Open the full workspace
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
