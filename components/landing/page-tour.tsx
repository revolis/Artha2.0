"use client"

import Link from "next/link"

import {
  Activity,
  ArrowRight,
  ArrowUpDown,
  CalendarRange,
  FileText,
  LayoutDashboard,
  ListChecks,
  Settings2,
  Target,
  Wallet,
  type AppIcon,
} from "@/components/icons"
import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { demoLedger } from "@/lib/landing-stats"

interface PageEntry {
  icon: AppIcon
  name: string
  href: string
  body: string
  detail: string
}

const PAGES: PageEntry[] = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    href: "/dashboard",
    body: "The year in one screen — portfolio value, net and gross, monthly profit and loss, where your income comes from, and your pinned goals.",
    detail: "One tab per year, each with its own goals",
  },
  {
    icon: ListChecks,
    name: "Entries",
    href: "/entries",
    body: "The full ledger. Search it, filter by type, source, tag or date, and open any row to read the whole note and see the screenshots attached to it.",
    detail: `${demoLedger.entries} entries in the demo`,
  },
  {
    icon: ArrowUpDown,
    name: "Fiat/P2P",
    href: "/p2p",
    body: "Every cash conversion with its direction, rate and cash amount, plus totals for USD sold, USD bought and your average selling rate.",
    detail: `${demoLedger.p2pTrades} trades recorded`,
  },
  {
    icon: Wallet,
    name: "Portfolio",
    href: "/portfolio",
    body: "The running balance over time, and a ranking of what's actually growing it — by category or by source, with the drains listed too.",
    detail: "Net against gross, over any window",
  },
  {
    icon: Activity,
    name: "Analytics",
    href: "/analytics",
    body: "Income against expense month by month, your best and worst months in full, and the five biggest wins and costs of the year.",
    detail: "Switch years from the header",
  },
  {
    icon: Target,
    name: "Goals",
    href: "/goals",
    body: "Targets with a period and a gauge that keeps counting past 100%. Pin any of them to the dashboard for the year they belong to.",
    detail: `${demoLedger.goals} goals across the demo years`,
  },
  {
    icon: CalendarRange,
    name: "Year Heatmap",
    href: "/heatmap",
    body: "A square for every day, shaded by that day's net result — so a good streak or a bad week is obvious at a glance.",
    detail: `${demoLedger.activeDays} days with activity`,
  },
  {
    icon: FileText,
    name: "Reports",
    href: "/reports",
    body: "Build an export from a report type and a period — tax entries, cash conversions, fees, or the lot — each carrying its own totals.",
    detail: "Four quick reports, or roll your own",
  },
  {
    icon: Settings2,
    name: "Settings & Profile",
    href: "/settings",
    body: "Display currency, timezone, time format, notification preferences, privacy mode and the live rate table — plus your profile and social links.",
    detail: "Changes apply across every page",
  },
]

function PageRow({ page }: { page: PageEntry }) {
  const Icon = page.icon
  return (
    <Link
      href={page.href}
      className="group flex h-full flex-col gap-2.5 rounded-xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          <Icon className="size-4" />
        </span>
        <span className="font-semibold">{page.name}</span>
        <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {page.body}
      </p>
      <span className="mt-auto pt-1 text-[10px] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
        {page.detail}
      </span>
    </Link>
  )
}

export function PageTour() {
  return (
    <section id="pages" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="The workspace"
        title="Nine surfaces, each with a single purpose"
        description="Open any of them to see it working against the demo ledger — the same data throughout, examined from a different angle each time."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map((page, index) => (
          <Reveal key={page.name} delay={index * 55} className="h-full">
            <PageRow page={page} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
