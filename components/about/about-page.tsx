"use client"

import { useRouter } from "next/navigation"
import {
  Check,
  Circle,
  KeyRound,
  Loader,
  PencilLine,
  Wallet,
} from "@/components/icons"

import { ArthaMark } from "@/components/layout/artha-mark"
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
import { SITE } from "@/lib/site"
import { cn } from "@/lib/utils"

const PRINCIPLES = [
  {
    icon: PencilLine,
    title: "Entered by hand, on purpose",
    body: "Nothing syncs with an exchange. You type what happened, which means Artha only ever knows what you choose to tell it.",
  },
  {
    icon: KeyRound,
    title: "No keys, no logins, no access",
    body: "There are no API keys to paste and no accounts to connect, so there is nothing that could read your balances or move your funds.",
  },
  {
    icon: Wallet,
    title: "One place for everything",
    body: "Crypto, stocks and cash income sit side by side, in the currency you pick, rather than scattered across five apps and a spreadsheet.",
  },
]

const ROADMAP = [
  { status: "done", label: "Dashboard, entries and Fiat/P2P" },
  { status: "done", label: "Portfolio, analytics and heatmap" },
  { status: "done", label: "Goals, reports and exports" },
  { status: "done", label: "Profile and settings" },
  { status: "doing", label: "Landing page and sign-in" },
  { status: "next", label: "A real backend, so data leaves the browser" },
  { status: "next", label: "Daily USD to NPR rate sync" },
] as const

const FACTS = [
  { label: "Entry method", value: "Manual only" },
  { label: "Currencies", value: "USD, NPR, INR, EUR, GBP, AED" },
  { label: "Exports", value: "PDF, CSV, JSON" },
  { label: "Price", value: "Free, with no paid tier" },
  { label: "Data location", value: "This browser, for now" },
  { label: "Built with", value: "Next.js, TypeScript, Tailwind, shadcn/ui" },
]

export function AboutPage() {
  const router = useRouter()

  return (
    <AppShell>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Support
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">About Us</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <ArthaMark className="size-18 text-foreground" />
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-semibold tracking-[0.18em]">
              {SITE.name}
            </span>
            <span className="text-muted-foreground">{SITE.tagline}</span>
          </div>
          <Badge variant="secondary">Version 0.1 · Design preview</Badge>
          <p className="max-w-xl text-sm text-muted-foreground">
            Artha started from a simple problem: money coming in from airdrops,
            trades, launchpads and P2P cash-outs, with no single place showing
            what any of it added up to. Spreadsheets drifted. Exchange
            dashboards only knew their own corner. So this became the one place
            where the whole picture lives.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((principle) => (
          <Card key={principle.title}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border bg-muted/50">
                <principle.icon className="size-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">{principle.title}</span>
              <p className="text-sm text-muted-foreground">{principle.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where it is up to</CardTitle>
            <CardDescription>
              Built in the open, one page at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {ROADMAP.map((item) => (
                <li key={item.label} className="flex items-start gap-2.5">
                  {item.status === "done" ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : item.status === "doing" ? (
                    <Loader className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      item.status === "next" && "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The short version</CardTitle>
            <CardDescription>
              Everything worth knowing, in a list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {fact.label}
                  </span>
                  <span className="text-right text-sm font-medium">
                    {fact.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              Got a thought on where this should go?
            </span>
            <span className="text-sm text-muted-foreground">
              Artha is shaped by whoever uses it. That includes you.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/contact")}>
              Get in touch
            </Button>
            <Button variant="outline" onClick={() => router.push("/help")}>
              Help Centre
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  )
}
