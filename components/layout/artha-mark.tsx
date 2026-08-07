import { cn } from "@/lib/utils"

/**
 * The Artha mark: ascending columns with a rising accent across them.
 *
 * Drawn rather than loaded as an image so it stays sharp at any size and
 * takes its colour from the theme — the original PNG was 32×32 and its dark
 * ink all but disappeared against the dark sidebar. The columns inherit
 * `currentColor`; the accent uses the theme's warm chart token.
 */
export function ArthaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Artha"
      className={cn("size-8", className)}
    >
      {/* Columns, tallest on the right, each chamfered at the top. */}
      <path
        d="M4 27V15.5L7.5 12l3.5 3.5V27z"
        fill="currentColor"
        fillOpacity="0.55"
      />
      <path d="M13 27V9l3.5-3.5L20 9v18z" fill="currentColor" />
      <path
        d="M22 27v-8.5l3.5-3.5 3.5 3.5V27z"
        fill="currentColor"
        fillOpacity="0.75"
      />

      {/* The rise across them. */}
      <path
        d="M3 21.5 10.5 14l5.5 5.5L28 8"
        stroke="var(--chart-2)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
