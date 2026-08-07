"use client"

import * as React from "react"

import { useInView } from "@/lib/use-in-view"
import { cn } from "@/lib/utils"

/**
 * Lifts its children into place the first time they're scrolled to.
 *
 * The visible state is written as an inline style off React state rather than
 * left to a CSS class, and the delay is a timer rather than a transition-delay.
 * That way a browser that never runs the transition still lands on the final
 * state instead of holding the content at zero opacity — an invisible section
 * is a far worse outcome than one that appears without sliding.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode
  /** Milliseconds to wait after the section is reached. */
  delay?: number
  /** How far below its resting place it starts, in pixels. */
  y?: number
  className?: string
  as?: React.ElementType
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const [shown, setShown] = React.useState(false)

  React.useEffect(() => {
    if (!inView) return
    const timer = window.setTimeout(() => setShown(true), delay)
    return () => window.clearTimeout(timer)
  }, [inView, delay])

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        className
      )}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
      }}
    >
      {children}
    </Tag>
  )
}

/** Reveals each child in turn, for grids and lists. */
export function RevealGroup({
  children,
  className,
  step = 70,
  startDelay = 0,
  y = 16,
}: {
  children: React.ReactNode
  className?: string
  /** Gap between one child appearing and the next. */
  step?: number
  startDelay?: number
  y?: number
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <Reveal delay={startDelay + index * step} y={y}>
          {child}
        </Reveal>
      ))}
    </div>
  )
}
