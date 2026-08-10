import type { Metadata } from "next"

import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { Faq } from "@/components/landing/faq"
import { FinalCta } from "@/components/landing/final-cta"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingNav } from "@/components/landing/landing-nav"
import { PageTour } from "@/components/landing/page-tour"
import { TracksMarquee } from "@/components/landing/tracks-marquee"
import { WaveDivider } from "@/components/landing/wave-divider"
import { WavyBand } from "@/components/landing/wavy-band"

export const metadata: Metadata = {
  title: "ARTHA — Know exactly where your money stands",
  description:
    "A precision dashboard for all your income/expenses. Record every gain, loss, fee and conversion as it happens — reported in your currency, at the day's rate. Explore the live demo.",
}

export default function Page() {
  return (
    // No background of its own: an opaque wrapper here would paint over the
    // site-wide star field, which sits behind the page content.
    <div className="flex min-h-svh flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <DashboardPreview />
        <TracksMarquee />
        <WavyBand />
        <WaveDivider />
        <PageTour />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
