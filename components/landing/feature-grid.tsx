"use client"

import {
  Activity,
  ArrowUpDown,
  CalendarRange,
  Database,
  EyeOff,
  FileDown,
  Globe,
  PencilLine,
  Target,
  TrendingUp,
  type AppIcon,
} from "@/components/icons"
import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import DataFeedingIn from "@/components/ui/data-feeding-in"
import { demoLedger } from "@/lib/landing-stats"
import { cn } from "@/lib/utils"

interface Feature {
  icon: AppIcon
  title: string
  body: string
  /** Columns to span on wide screens. */
  span?: string
  /** Optional figure printed large inside the tile. */
  figure?: string
  figureLabel?: string
  tags?: string[]
}

const FEATURES: Feature[] = [
  {
    icon: PencilLine,
    title: "Six entry types, recorded deliberately",
    body: "Profit, loss, cash conversion, fee, tax and transfer. Each carries a category, a source, tags, a note and supporting screenshots — so a figure from eight months ago still explains itself.",
    span: "lg:col-span-2",
    tags: ["Profit", "Loss", "Fiat/P2P", "Fee", "Tax", "Transfer"],
  },
  {
    icon: ArrowUpDown,
    title: "Conversions at the rate you negotiated",
    body: "Direction, cash currency, rate and settled amount, captured per trade. Market rates refresh from a public feed on demand; individual deals can carry the rate you actually agreed.",
    span: "lg:col-span-2",
    figure: "152.03",
    figureLabel: "NPR per USD, current market rate",
  },
  {
    icon: TrendingUp,
    title: "Net measured against gross",
    body: "Two series on one axis. Gross is everything earned after losses, fees and tax; net removes what you have converted out. The distance between them is your withdrawal history, drawn to scale.",
    span: "lg:col-span-2",
  },
  {
    icon: Target,
    title: "Targets that account for the overshoot",
    body: "A three-part gauge reading completed, remaining and exceeded — so passing a target is visible rather than merely capped at full.",
  },
  {
    icon: CalendarRange,
    title: "The year, day by day",
    body: "Every date rendered as a cell and shaded by that day's net result, turning a productive stretch or a costly week into something you can see immediately.",
    figure: String(demoLedger.activeDays),
    figureLabel: "days recorded in the demo",
  },
  {
    icon: Activity,
    title: "Analysis worth acting on",
    body: "Strongest and weakest months in full, the five largest gains and costs of the year, and income set against expense across every month.",
  },
  {
    icon: Globe,
    title: "Six currencies, one setting",
    body: "Choose a display currency and every figure on every surface converts at the stored rate — tables, charts, targets and totals alike.",
    tags: ["NPR", "USD", "INR", "EUR", "GBP", "AED"],
  },
  {
    icon: EyeOff,
    title: "Discretion on demand",
    body: "A single control conceals every amount on screen while leaving the underlying record untouched — for shared desks and public places.",
  },
  {
    icon: FileDown,
    title: "Reporting and export",
    body: "Tax entries, cash conversions, platform fees or the complete ledger — filtered to a period, totalled, and ready to hand to an accountant.",
  },
  {
    icon: Database,
    title: "Four years, side by side",
    body: "Each year keeps its own tab, its own targets and its own totals — so last year stays intact while this one is still being written, and comparing the two takes one click.",
    span: "lg:col-span-2",
    figure: `${demoLedger.firstYear}–${demoLedger.lastYear}`,
    figureLabel: "in the demo ledger",
  },
]

function FeatureTile({ feature }: { feature: Feature }) {
  const Icon = feature.icon
  return (
    <Card
      size="sm"
      className={cn(
        "group h-full transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg hover:shadow-black/5"
      )}
    >
      <CardContent className="flex h-full flex-col gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          <Icon className="size-4" />
        </span>

        <h3 className="text-base leading-snug font-semibold">
          {feature.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {feature.body}
        </p>

        {feature.figure ? (
          <div className="mt-auto flex flex-col gap-0.5 pt-2">
            <span className="text-2xl font-semibold tabular-nums">
              {feature.figure}
            </span>
            <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {feature.figureLabel}
            </span>
          </div>
        ) : null}

        {feature.tags ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {feature.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** The band that opens the section: the case for the method, and a diagram of it. */
function ConvergenceBand() {
  return (
    <div className="mb-16 grid items-center gap-10 lg:grid-cols-2">
      {/* Both columns take min-w-0: a grid item defaults to min-width:auto, so
          the fixed-width illustration would otherwise set the column width and
          drag the text column out past the viewport with it. */}
      <Reveal className="min-w-0">
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-medium tracking-[0.2em] text-[var(--chart-2)] uppercase">
            One ledger
          </span>
          <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Every stream, resolved into a single line
          </h3>
          <p className="leading-relaxed text-muted-foreground">
            An exchange payout, a losing position, a withdrawal fee, an invoice
            settled in cash, a P2P trade at a rate you negotiated yourself. Each
            arrives on its own terms and in its own currency — and each lands in
            the same ledger, converted, categorised and counted.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Nothing is estimated on your behalf. That is the whole point.
          </p>
        </div>
      </Reveal>

      <Reveal delay={140} className="min-w-0">
        {/* Pulses travelling along converging paths into a ledger table. The
            illustration is a fixed 400px, so on a phone it is scaled down and
            the wrapper clips whatever still reaches past the edge. */}
        <div className="flex w-full justify-center overflow-hidden lg:justify-end">
          <div className="shrink-0 scale-[0.78] sm:scale-100">
            <DataFeedingIn />
          </div>
        </div>
      </Reveal>
    </div>
  )
}

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="Capabilities"
        title="Built for people who keep their own books"
        description="Ten deliberate features, each earning its place. No automated guesswork, no imported approximations — just the instruments you need to read your own position accurately."
      />

      <ConvergenceBand />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal
            key={feature.title}
            delay={index * 60}
            className={cn("h-full", feature.span)}
          >
            <FeatureTile feature={feature} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
