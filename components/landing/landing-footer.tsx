import Link from "next/link"

import { FooterSpotlight } from "@/components/landing/footer-spotlight"
import { ArthaMark } from "@/components/layout/artha-mark"
import { MadeBy } from "@/components/layout/made-by"
import { Separator } from "@/components/ui/separator"

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: "Overview",
      links: [
        { label: "Dashboard", href: "/demo?next=/dashboard" },
        { label: "Entries", href: "/demo?next=/entries" },
        { label: "Fiat/P2P", href: "/demo?next=/p2p" },
        { label: "Portfolio", href: "/demo?next=/portfolio" },
        { label: "Analytics", href: "/demo?next=/analytics" },
      ],
    },
    {
      heading: "Planning",
      links: [
        { label: "Goals", href: "/demo?next=/goals" },
        { label: "Year Heatmap", href: "/demo?next=/heatmap" },
        { label: "Reports", href: "/demo?next=/reports" },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "Profile", href: "/profile" },
        { label: "Billing", href: "/billing" },
        { label: "Settings", href: "/settings" },
      ],
    },
    {
      heading: "Support",
      links: [
        { label: "Help Centre", href: "/help" },
        { label: "Contact Us", href: "/contact" },
        { label: "About Us", href: "/about" },
      ],
    },
  ]

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <ArthaMark className="size-7" />
              <span className="text-base font-semibold tracking-[0.14em]">
                ARTHA
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              A precision dashboard for all your income/expenses —
              recorded deliberately, reported exactly.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                {column.heading}
              </span>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Artha</span>
          <MadeBy className="font-medium" />
          {/* Named after what the app does with money rather than what kind
              of money it is — and it matches the three things you can
              actually record: what you hold, what it paid, and what you
              converted. */}
          <span>Holdings · Income · Conversions — reported in your currency</span>
        </div>

        {/* Clipped at the baseline so the wordmark sits into the bottom edge
            of the page rather than floating above it. */}
        <div className="-mb-14 max-h-[9rem] overflow-hidden sm:-mb-20 sm:max-h-[13rem]">
          <FooterSpotlight />
        </div>
      </div>
    </footer>
  )
}
