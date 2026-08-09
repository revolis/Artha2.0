"use client"

import { useRouter } from "next/navigation"
import {
  Check,
  Circle,
  Layers,
  Loader,
  PencilLine,
  Wallet,
} from "@/components/icons"

import { ArthaMark } from "@/components/layout/artha-mark"
import { AppShell } from "@/components/layout/app-shell"
import { ContactChannels } from "@/components/layout/contact-channels"
import { MadeBy } from "@/components/layout/made-by"
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
    title: "Recorded deliberately",
    body: "Nothing is imported from an exchange. You enter what happened, which is why the ledger reflects the deal you actually made rather than what an API decided to report.",
  },
  {
    icon: Layers,
    title: "Built for the awkward cases",
    body: "Peer-to-peer trades at a negotiated rate, income settled in cash, fees and tax on both sides of a position. The things automated tools quietly leave out.",
  },
  {
    icon: Wallet,
    title: "One ledger, one currency",
    body: "Crypto, equities and cash income sit together and report in whichever currency you work in — rather than scattered across five dashboards and a spreadsheet.",
  },
]

const ROADMAP = [
  { status: "done", label: "Dashboard, entries and Fiat/P2P" },
  { status: "done", label: "Portfolio, analytics and heatmap" },
  { status: "done", label: "Goals, reports and exports" },
  { status: "done", label: "Profile and settings" },
  { status: "done", label: "Landing page and account screens" },
  { status: "doing", label: "Accounts and synced storage" },
  { status: "next", label: "Scheduled exchange-rate updates" },
] as const

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
          <Badge variant="secondary">Version {SITE.version}</Badge>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Artha began with a problem worth solving properly: income arriving
            from airdrops, trades, launchpads and peer-to-peer cash-outs, and no
            single place that could say what it amounted to. Spreadsheets
            drifted out of date. Each exchange knew only its own corner, and
            none of them knew about the cash. This is the ledger that holds all
            of it — entered deliberately, reported exactly, in the currency you
            actually think in.
          </p>
          <MadeBy className="text-sm" />
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
            <CardTitle>Where it stands</CardTitle>
            <CardDescription>
              Built in the open, one surface at a time.
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
            <CardTitle>Get in touch</CardTitle>
            <CardDescription>
              Questions, corrections and requests all reach the same person.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactChannels className="sm:grid-cols-1" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              A view on where this should go next?
            </span>
            <span className="text-sm text-muted-foreground">
              Artha is shaped by the people keeping books in it. That includes
              you.
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
