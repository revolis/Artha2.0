"use client"

// The first thing worth pressing on the landing page.
//
// It is the one action that shows rather than tells, so it has to win the eye
// against a headline, a paragraph and a screenshot. Three signals do that
// without turning into a carnival:
//
// A live dot, the same one every broadcast uses, because "live demo" is
// literally what it means — there is a real dashboard with real rows behind
// it, not a video. It stays the button's own foreground colour, which is the
// highest contrast available against the button in either theme.
//
// A warm glow resting under the button, in the same family as the bloom
// behind the headline. It never moves, so it is the part that still works
// during the pause between pulses and for anyone who has asked for less
// motion.
//
// A ring that expands out of the edge and fades, every few seconds rather
// than continuously. Something that never stops moving becomes wallpaper; a
// pulse with a pause in it keeps catching the eye on the second look.
//
// The glow and the ring take their colour from --demo-glow / --demo-ring,
// which differ per theme, rather than from the button's own --primary.
// Tinting with --primary looked like light in dark mode only by accident:
// that token is near-white there and near-black in light mode, so on a white
// page it was a grey smudge sitting behind an almost-black button — no hue
// to read as light, and too close to the button to read as a halo.
//
// All of it is CSS, so nothing here depends on JavaScript running, and the
// ring stops under prefers-reduced-motion, where an animation that repeats
// forever is the exact thing being asked about.

import Link from "next/link"

import { ArrowRight } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LiveDemoButton({ className }: { className?: string }) {
  return (
    // rounded-4xl matches the button, so the ring follows the pill rather
    // than boxing it.
    <span
      className={cn(
        "relative inline-flex rounded-4xl",
        "motion-safe:animate-demo-halo",
        className
      )}
    >
      {/* The resting glow. Behind the button, ignoring pointer events so it
          can never swallow the click it is drawing attention to. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 -z-10 rounded-4xl bg-[var(--demo-glow)] blur-lg"
      />

      <Button size="lg" render={<Link href="/demo" />} nativeButton={false}>
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full rounded-full bg-current opacity-75 motion-safe:animate-ping motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
        Explore the live demo
        <ArrowRight data-icon="inline-end" />
      </Button>
    </span>
  )
}
