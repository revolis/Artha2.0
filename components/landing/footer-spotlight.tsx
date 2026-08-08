"use client"

import * as React from "react"

/**
 * The oversized ARTHA wordmark that closes the page, lit by a spotlight that
 * follows the cursor.
 *
 * Two copies of the word sit on top of each other: a barely-there base, and an
 * identical layer whose fill is a radial gradient clipped to the glyphs. Moving
 * the gradient's centre moves the light across the letters. A blurred bloom
 * behind it lets the glow spill past the edges.
 *
 * The light rests at the centre of the word until the pointer arrives, so it
 * reads as deliberate on a phone and in any browser that never reports a
 * pointer at all.
 */
export function FooterSpotlight() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [spot, setSpot] = React.useState<{ x: number; y: number } | null>(null)

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    setSpot({ x: event.clientX - box.left, y: event.clientY - box.top })
  }

  // Percentages while the pointer is away, so the resting position is correct
  // at any width without having to measure the element first.
  const centre = spot ? `${spot.x}px ${spot.y}px` : "50% 55%"

  const glow = `radial-gradient(320px circle at ${centre}, var(--chart-2) 0%, color-mix(in oklab, var(--chart-2) 55%, transparent) 30%, transparent 68%)`

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setSpot(null)}
      className="relative flex justify-center overflow-hidden select-none"
    >
      {/* The bloom, spilling past the glyphs. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
        style={{ backgroundImage: glow }}
      />

      <div className="relative w-full">
        {/* Base: the word, only just visible. */}
        <span
          aria-hidden
          className="block text-center text-[clamp(3.5rem,19vw,16rem)] leading-[0.78] font-semibold tracking-tighter text-foreground/[0.07]"
        >
          ARTHA
        </span>

        {/* Lit layer: the same word, filled with the spotlight and clipped to
            the glyphs so only the letters catch the light. */}
        <span
          className="absolute inset-0 block text-center text-[clamp(3.5rem,19vw,16rem)] leading-[0.78] font-semibold tracking-tighter text-transparent"
          style={{
            backgroundImage: glow,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          ARTHA
        </span>
      </div>
    </div>
  )
}
