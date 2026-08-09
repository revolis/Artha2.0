"use client"

// The first thing worth pressing on the landing page.
//
// It is the one action that shows rather than tells, so it has to win the eye
// against a headline, a paragraph and a screenshot. Two signals do that
// without turning into a carnival:
//
// A live dot, the same one every broadcast uses, because "live demo" is
// literally what it means — there is a real dashboard with real rows behind
// it, not a video.
//
// A halo that expands out of the button and fades, every few seconds rather
// than continuously. Something that never stops moving becomes wallpaper; a
// pulse with a pause in it keeps catching the eye on the second look.
//
// Both are CSS. Nothing here depends on JavaScript running, and both stop
// under prefers-reduced-motion, where an animation that repeats forever is
// the exact thing being asked about.

import Link from "next/link"

import { ArrowRight } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LiveDemoButton({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      {/* The halo. Behind the button, ignoring pointer events so it can never
          swallow the click it is drawing attention to. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/30 motion-safe:animate-demo-halo motion-reduce:hidden"
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
