"use client"

import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars"

/**
 * The drifting star field that sits behind every page.
 *
 * Fixed to the viewport rather than the document, so it stays put while the
 * page scrolls, and pinned behind everything at a negative z-index. Cards and
 * panels carry their own opaque surface, so the field only ever shows through
 * the gutters between them.
 *
 * It is decorative and must never intercept a click, hence `pointer-events` off
 * on both the wrapper and the component's own parallax layer — the parallax
 * follows the cursor, and it is not worth stealing pointer events from the
 * whole application to keep it.
 */
export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <StarsBackground
        className="bg-transparent"
        // The chart accent, so the specks belong to the same palette as
        // everything drawn on top of them.
        starColor="var(--chart-2)"
        pointerEvents={false}
        // Slow enough to read as ambient rather than as something moving.
        speed={260}
        // A third of the stock field: this runs on every page, and the
        // gutters between cards only ever show a little of it.
        density={0.35}
      />
    </div>
  )
}
