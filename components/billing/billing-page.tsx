"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Heart,
  Infinity as InfinityIcon,
  Sparkles,
  X,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SITE } from "@/lib/site"
import { useEntryData } from "@/lib/use-entry-data"
import { useGoals } from "@/lib/use-goals"
import { useProfile } from "@/lib/use-profile"

const INCLUDED = [
  "Unlimited entries, every year",
  "Crypto, stocks and cash in one place",
  "Fiat/P2P tracking with rates",
  "Portfolio, analytics and heatmap",
  "Goals with pacing and milestones",
  "PDF, CSV and JSON exports",
  "Every display currency",
  "Light, dark and system themes",
]

const NEVER = [
  "Ask for a card",
  "Start a trial that quietly ends",
  "Lock a feature behind a tier",
  "Show you an advert",
  "Sell or share your data",
  "Email you a renewal notice",
]

export function BillingPage() {
  const router = useRouter()
  const { profile } = useProfile()
  const { entries, sources } = useEntryData()
  const { goals } = useGoals()

  const period = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date())

  // A real invoice, with real usage — it just never adds up to anything.
  const lineItems = [
    {
      label: "Entries recorded",
      detail: `${entries.length} this account`,
      amount: 0,
    },
    {
      label: "Sources tracked",
      detail: `${sources.length} platforms`,
      amount: 0,
    },
    {
      label: "Goals in progress",
      detail: `${goals.length} targets`,
      amount: 0,
    },
    { label: "Reports exported", detail: "Unlimited", amount: 0 },
    { label: "Seats", detail: "Just you", amount: 0 },
  ]

  return (
    <AppShell>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Account
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Artha Free — the only plan there is
          </Badge>

          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-semibold tracking-tight tabular-nums">
              $0
            </span>
            <span className="text-lg text-muted-foreground">/ forever</span>
          </div>

          <p className="max-w-md text-sm text-muted-foreground">
            There is no paid tier to upgrade to, no trial counting down, and no
            card on file. {SITE.name} is a personal project — everything in it
            is yours to use.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button onClick={() => router.push("/dashboard")}>
              Back to dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push("/settings")}>
              Manage account
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Statement for {period}</CardTitle>
            <CardDescription>
              Billed to {profile.email} · Payment method: none required
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col divide-y">
              {lineItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.detail}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">
                    $0.00
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Total due</span>
              <span className="text-2xl font-semibold text-success tabular-nums">
                $0.00
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Nothing will be charged, because there is nothing to charge. No
              invoice will ever arrive in your inbox.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfinityIcon className="size-4" />
                What you get
              </CardTitle>
              <CardDescription>
                All of it. There is no other tier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What we will never do</CardTitle>
              <CardDescription>
                Worth writing down, so it stays true.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {NEVER.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
              <Heart className="size-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                Want to give something back?
              </span>
              <span className="text-sm text-muted-foreground">
                Tell us what to build next. That is worth more than a
                subscription.
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/contact")}>
            Send feedback
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  )
}
