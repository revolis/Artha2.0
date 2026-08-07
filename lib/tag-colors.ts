// A stable colour per tag.
//
// "Random" but not arbitrary: the colour is derived from the tag's own text, so
// "alpha" is the same shade every time it appears and on every page, rather
// than changing between renders. Colours come from the theme's chart palette,
// so they stay in key with the rest of the site and follow light/dark.

const TAG_PALETTE = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
] as const

/** Deterministic integer hash — same string always lands on the same slot. */
function hash(value: string): number {
  let out = 0
  for (let i = 0; i < value.length; i += 1) {
    out = (Math.imul(out, 31) + value.charCodeAt(i)) | 0
  }
  return Math.abs(out)
}

export interface TagStyle {
  /** Inline style: tinted background, matching border and text. */
  backgroundColor: string
  borderColor: string
  color: string
}

export function tagStyle(tag: string): TagStyle {
  const token = TAG_PALETTE[hash(tag.toLowerCase()) % TAG_PALETTE.length]
  return {
    backgroundColor: `color-mix(in oklab, var(--${token}) 14%, transparent)`,
    borderColor: `color-mix(in oklab, var(--${token}) 35%, transparent)`,
    color: `var(--${token})`,
  }
}

/** Just the dot/swatch colour, for legends and markers. */
export function tagColor(tag: string): string {
  const token = TAG_PALETTE[hash(tag.toLowerCase()) % TAG_PALETTE.length]
  return `var(--${token})`
}
