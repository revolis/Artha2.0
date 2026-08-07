"use client"

import * as React from "react"
import { motion, useAnimation } from "motion/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Adapted from @gammaui/magnetize-button. The original shipped fixed violet
// colours, a magnet icon and its own label; this one takes the foreground /
// background pair so it reads as solid black on white and solid white on
// black, and renders whatever label it is given.

// Takes the Button's own props so variant, size and the rest pass straight
// through rather than being redeclared here.
type MagnetizeButtonProps = React.ComponentProps<typeof Button> & {
  particleCount?: number
}

interface Particle {
  id: number
  x: number
  y: number
}

/**
 * Resting positions for the specks, spread around the button on a golden-angle
 * spiral. Worked out from the index rather than drawn at random: the server and
 * the browser then agree on the markup, and the spread comes out even instead
 * of clumping the way random points do.
 */
function scatterPositions(count: number): Particle[] {
  const GOLDEN_ANGLE = 2.399963
  return Array.from({ length: count }, (_, i) => {
    const radius = 42 + (i / count) * 68
    const angle = i * GOLDEN_ANGLE
    return {
      id: i,
      x: Math.round(Math.cos(angle) * radius * 1.6),
      y: Math.round(Math.sin(angle) * radius),
    }
  })
}

export function MagnetizeButton({
  className,
  particleCount = 12,
  children,
  ...props
}: MagnetizeButtonProps) {
  const particles = React.useMemo(
    () => scatterPositions(particleCount),
    [particleCount]
  )
  const particlesControl = useAnimation()

  const gather = React.useCallback(() => {
    particlesControl.start({
      x: 0,
      y: 0,
      opacity: 0.9,
      transition: { type: "spring", stiffness: 60, damping: 12 },
    })
  }, [particlesControl])

  const scatter = React.useCallback(() => {
    particlesControl.start((i: number) => ({
      x: particles[i]?.x ?? 0,
      y: particles[i]?.y ?? 0,
      opacity: 0,
      transition: { type: "spring", stiffness: 100, damping: 16 },
    }))
  }, [particlesControl, particles])

  return (
    <Button
      className={cn(
        "relative touch-none overflow-hidden",
        "bg-foreground text-background hover:bg-foreground/90",
        className
      )}
      onMouseEnter={gather}
      onMouseLeave={scatter}
      onTouchStart={gather}
      onTouchEnd={scatter}
      {...props}
    >
      {particles.map((particle, index) => (
        <motion.span
          key={particle.id}
          aria-hidden
          custom={index}
          initial={{ x: particle.x, y: particle.y, opacity: 0 }}
          animate={particlesControl}
          className="pointer-events-none absolute size-1 rounded-full bg-background/70"
        />
      ))}
      <span className="relative flex items-center gap-1.5">{children}</span>
    </Button>
  )
}

export default MagnetizeButton
