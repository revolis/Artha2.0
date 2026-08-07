"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"

import { cn } from "@/lib/utils"

/**
 * Renders a Hugeicons stroke icon at a consistent weight. `size` is left to
 * CSS so the icon scales with its class rather than a fixed pixel prop —
 * that keeps it aligned with the text beside it.
 */
export function NavIcon({
  icon,
  className,
  strokeWidth = 1.6,
}: {
  icon: IconSvgElement
  className?: string
  strokeWidth?: number
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      strokeWidth={strokeWidth}
      className={cn("size-full", className)}
    />
  )
}
