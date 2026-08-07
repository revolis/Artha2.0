"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { demoLedger } from "@/lib/landing-stats"

const FAQS = [
  {
    q: "Do I need an account to try it?",
    a: "No. The demo is the real application with a ledger already in it — press Live Demo and you're in. There's no sign-up form anywhere on the site.",
  },
  {
    q: "Where is my data kept?",
    a: "In your own browser's storage, on your own machine. There is no server and no database behind Artha, which is why there's nothing to log into and nothing to leak. Clearing your browser data clears the ledger with it.",
  },
  {
    q: "Does it connect to my exchange or bank?",
    a: "No, and that's deliberate. You type entries in yourself. The one thing fetched from the internet is the daily exchange-rate table, so conversions use a real market rate rather than a number from last year.",
  },
  {
    q: "What's the difference between net and gross portfolio value?",
    a: "Gross is everything you earned less losses, fees and tax. Net takes off the money you've moved out to cash and adds back anything you've put in. On the chart they're two lines — the gap between them is exactly what you've cashed out.",
  },
  {
    q: "Can I see the totals in rupees instead of dollars?",
    a: `Yes. Amounts are stored in USD and displayed in whichever of the ${demoLedger.currencies} currencies you pick in Settings — NPR, USD, INR, EUR, GBP or AED. Every figure on every page follows the setting.`,
  },
  {
    q: "Is the demo data real?",
    a: `It's invented, but it behaves like the real thing: ${demoLedger.entries} entries spread over ${demoLedger.years} years, ${demoLedger.categories} categories, ${demoLedger.sources} sources, with rates that drift the way the rupee actually has. It's there so the charts have something honest to draw.`,
  },
  {
    q: "Will anything I add in the demo be saved?",
    a: "Yes — to your browser only, and only for you. Add entries, edit goals, change the display currency; it'll all still be there next time. Clear your site data to put the demo back as it was.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-5 py-16">
      <SectionHeading
        eyebrow="Questions"
        title="The things worth knowing first"
      />

      <Reveal delay={120}>
        <Accordion className="w-full">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="text-left text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  )
}
