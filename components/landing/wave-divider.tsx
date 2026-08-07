"use client"

import WavePath from "@/components/ui/wave-path"

/**
 * A hairline between sections that answers to the cursor — drag across it and
 * it bends, then settles. Decorative only, so it is hidden from assistive tech.
 */
export function WaveDivider() {
  return (
    <div
      aria-hidden
      className="flex justify-center overflow-hidden py-16 text-border"
    >
      <WavePath />
    </div>
  )
}
