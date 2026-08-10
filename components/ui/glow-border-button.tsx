"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A button whose border carries a travelling highlight.
 *
 * The light is a conic gradient painted on an oversized square sitting behind
 * the face and spun on its own axis. The frame clips it to a rounded rectangle,
 * so what shows through the one-pixel gap around the face is a bright arc
 * sweeping the edge. Done this way it costs one transform — no gradient-angle
 * interpolation and no per-frame work in JavaScript.
 *
 * The face is the page colour in both themes, so the arc is the whole button —
 * which is why its colour is a per-theme token rather than --chart-2. That
 * accent is a light gold: brilliant against a near-black page, and nearly
 * spent against a white one, where a one-pixel line has no room to be subtle.
 */
export function GlowBorderButton({
  children,
  className,
  render,
  ...props
}: React.ComponentProps<"button"> & {
  /** Element to render as instead of a button — a Link, typically. */
  render?: React.ReactElement<{ className?: string }>
}) {
  const inner = (
    <>
      {/* The spinning light. inset-[-200%] keeps the square wider than the
          frame's diagonal, so no corner is ever left unlit. */}
      <span
        aria-hidden
        className="absolute inset-[-200%] motion-reduce:hidden"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, var(--glow-sweep) 45deg, color-mix(in oklab, var(--glow-sweep) 35%, transparent) 80deg, transparent 130deg, transparent 360deg)",
          animation: "artha-border-spin 3.5s linear infinite",
        }}
      />
      {/* A static edge underneath, so it still reads as a button between
          sweeps and wherever animation is turned off. */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[inherit] border border-[var(--glow-edge)]"
      />
      <span className="relative inline-flex items-center justify-center gap-1.5 rounded-[inherit] bg-background px-4 py-1.5 text-sm font-medium transition-colors duration-300 group-hover:bg-accent">
        {children}
      </span>
    </>
  )

  const shell = cn(
    "group relative inline-flex overflow-hidden rounded-md p-px",
    "outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
    className
  )

  // The rendered element becomes the frame itself, rather than being nested
  // inside one — otherwise the link would only cover its own text.
  if (render) {
    return React.cloneElement(
      render,
      { className: cn(shell, render.props.className) },
      inner
    )
  }

  return (
    <button type="button" className={shell} {...props}>
      {inner}
    </button>
  )
}
