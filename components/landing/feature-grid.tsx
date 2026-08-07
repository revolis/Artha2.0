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
    title: "Six kinds of entry, typed in by you",
    body: "Profit, loss, Fiat/P2P, fee, tax and transfer. Each one carries a category, a source, tags, a note and screenshots — so months later you still know what it was.",
    span: "lg:col-span-2",
    tags: ["Profit", "Loss", "Fiat/P2P", "Fee", "Tax", "Transfer"],
  },
  {
    icon: ArrowUpDown,
    title: "Fiat and P2P, with the rate you actually got",
    body: "Record which way the money moved, the cash currency and the rate. Market rates refresh daily from a public feed — or override with the rate from your own deal.",
    span: "lg:col-span-2",
    figure: "152.03",
    figureLabel: "NPR per USD, updated today",
  },
  {
    icon: TrendingUp,
    title: "Net against gross",
    body: "Two lines, one chart. Gross is everything you made; net is what's left after the cash you took out. The gap between them is exactly what you've withdrawn.",
    span: "lg:col-span-2",
  },
  {
    icon: Target,
    title: "Goals that show the overshoot",
    body: "A three-part gauge — completed, remaining, and exceeded once you pass the target. Pin the ones you care about to the dashboard.",
  },
  {
    icon: CalendarRange,
    title: "A year at a glance",
    body: "Every day of the year as a square, shaded by what you made or lost that day.",
    figure: String(demoLedger.activeDays),
    figureLabel: "active days in the demo",
  },
  {
    icon: Activity,
    title: "Analytics that answer questions",
    body: "Best and worst month, top earners, biggest costs, income against expense — month by month.",
  },
  {
    icon: Globe,
    title: "Six currencies, one switch",
    body: "Pick a display currency and every figure on the site converts at the stored rate — tables, charts, goals, all of it.",
    tags: ["NPR", "USD", "INR", "EUR", "GBP", "AED"],
  },
  {
    icon: EyeOff,
    title: "Privacy mode",
    body: "One click blanks every amount on screen. The data is untouched — handy when someone's reading over your shoulder.",
  },
  {
    icon: FileDown,
    title: "Reports and exports",
    body: "Tax entries, cash conversions, fees, or the whole ledger — filtered, totalled and ready to hand over.",
  },
  {
    icon: Database,
    title: "It stays on your machine",
    body: "No account, no server, no upload. Everything lives in your browser's own storage, which is also why the demo needs nothing from you.",
    span: "lg:col-span-2",
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

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-5 py-16">
      <SectionHeading
        eyebrow="Features"
        title="Everything the dashboard does, and why"
        description="Artha doesn't connect to your exchange or read your bank. You type what happened — and in exchange you get numbers you can actually trust, because you put them there."
      />

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
