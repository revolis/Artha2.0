import type { Metadata } from "next"

import { ByTheNumbers } from "@/components/landing/by-the-numbers"
import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { Faq } from "@/components/landing/faq"
import { FeatureGrid } from "@/components/landing/feature-grid"
import { FinalCta } from "@/components/landing/final-cta"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingNav } from "@/components/landing/landing-nav"
import { PageTour } from "@/components/landing/page-tour"
import { TracksMarquee } from "@/components/landing/tracks-marquee"

export const metadata: Metadata = {
  title: "ARTHA — Know exactly where your money stands",
  description:
    "A personal finance dashboard for crypto, stocks and cash income. Track profit, loss, fees, tax and every rupee you cash out — in NPR and USD, at today's rate. Try the live demo, no sign-up.",
}

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <DashboardPreview />
        <TracksMarquee />
        <FeatureGrid />
        <ByTheNumbers />
        <PageTour />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
