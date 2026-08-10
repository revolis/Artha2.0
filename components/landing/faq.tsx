"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Reveal } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"

const FAQS = [
  {
    q: "What can I track in Artha?",
    a: "Everything you earn and everything it costs you — profit and loss, platform fees, network charges, tax set aside — and every conversion between what you hold and cash in hand.",
  },
  {
    q: "Does it connect to my exchange or my bank?",
    a: "No, and that is a deliberate design decision. Automated imports miss precisely the things that matter most: peer-to-peer trades at a negotiated rate, freelance income, cash settled in person. You enter what happened, so the ledger reflects reality rather than whatever an API chose to report.",
  },
  {
    q: "What separates net from gross portfolio value?",
    a: "Gross is everything earned once losses, fees and tax are accounted for. Net subtracts the money you have converted out to cash and restores anything you have put back in. Both are plotted together, and the distance between the two lines is exactly what you have withdrawn.",
  },
  {
    q: "Can I work in rupees rather than dollars?",
    a: "Yes. Amounts are held in USD and presented in whichever currency you choose — NPR, USD, INR, EUR, GBP or AED. Every table, chart, target and total follows the setting instantly.",
  },
  {
    q: "Where do the exchange rates come from?",
    a: "A public market feed, refreshed on demand and stored with the date it was taken, so you always know how current a conversion is. Individual peer-to-peer entries can carry the rate you actually negotiated instead of the market one.",
  },
  {
    q: "Can I look around before creating an account?",
    a: "Yes. The demo is the complete application, loaded with a representative ledger spanning several years — every page, every chart, every control, open to explore.",
  },
  {
    q: "Is the demo data taken from a real portfolio?",
    a: "No. It is constructed, but it behaves like the genuine article — quiet months and heavy ones, costs alongside the gains, and rupee rates that drift the way they have in practice, so the charts show you something meaningful.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-5 py-16">
      <SectionHeading eyebrow="Questions" title="Answered before you ask" />

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
