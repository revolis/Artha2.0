"use client"

// Twelve built-in avatars, drawn as inline SVG so they need no network, no
// image assets, and stay crisp at any size.

export type AvatarMotif = "orbit" | "prism" | "wave" | "grid" | "bloom" | "arc"

export interface AvatarPreset {
  id: string
  name: string
  motif: AvatarMotif
  from: string
  to: string
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "aurora",
    name: "Aurora",
    motif: "orbit",
    from: "#0f766e",
    to: "#22d3ee",
  },
  {
    id: "ember",
    name: "Ember",
    motif: "bloom",
    from: "#9a3412",
    to: "#fb923c",
  },
  {
    id: "indigo",
    name: "Indigo",
    motif: "prism",
    from: "#3730a3",
    to: "#818cf8",
  },
  { id: "moss", name: "Moss", motif: "wave", from: "#14532d", to: "#86efac" },
  { id: "slate", name: "Slate", motif: "grid", from: "#334155", to: "#94a3b8" },
  { id: "plum", name: "Plum", motif: "arc", from: "#6b21a8", to: "#e879f9" },
  { id: "gold", name: "Gold", motif: "bloom", from: "#92400e", to: "#fcd34d" },
  { id: "ocean", name: "Ocean", motif: "wave", from: "#0c4a6e", to: "#38bdf8" },
  { id: "rose", name: "Rose", motif: "orbit", from: "#9f1239", to: "#fda4af" },
  {
    id: "graphite",
    name: "Graphite",
    motif: "prism",
    from: "#18181b",
    to: "#71717a",
  },
  { id: "mint", name: "Mint", motif: "arc", from: "#065f46", to: "#5eead4" },
  { id: "sand", name: "Sand", motif: "grid", from: "#78350f", to: "#fde68a" },
]

export function getAvatarPreset(id?: string): AvatarPreset {
  return AVATAR_PRESETS.find((preset) => preset.id === id) ?? AVATAR_PRESETS[0]
}

function Motif({ motif }: { motif: AvatarMotif }) {
  switch (motif) {
    case "orbit":
      return (
        <g fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="3">
          <circle cx="32" cy="32" r="18" />
          <ellipse cx="32" cy="32" rx="26" ry="10" />
          <circle
            cx="32"
            cy="32"
            r="5"
            fill="white"
            fillOpacity="0.9"
            stroke="none"
          />
        </g>
      )
    case "prism":
      return (
        <g fill="white">
          <polygon points="32,12 50,44 14,44" fillOpacity="0.75" />
          <polygon points="32,24 42,44 22,44" fillOpacity="0.5" />
        </g>
      )
    case "wave":
      return (
        <g fill="none" stroke="white" strokeWidth="4" strokeLinecap="round">
          <path d="M8 40c8-12 16-12 24 0s16 12 24 0" strokeOpacity="0.75" />
          <path d="M8 26c8-12 16-12 24 0s16 12 24 0" strokeOpacity="0.4" />
        </g>
      )
    case "grid":
      return (
        <g fill="white">
          <rect
            x="14"
            y="14"
            width="14"
            height="14"
            rx="3"
            fillOpacity="0.85"
          />
          <rect x="36" y="14" width="14" height="14" rx="3" fillOpacity="0.5" />
          <rect x="14" y="36" width="14" height="14" rx="3" fillOpacity="0.5" />
          <rect
            x="36"
            y="36"
            width="14"
            height="14"
            rx="3"
            fillOpacity="0.85"
          />
        </g>
      )
    case "bloom":
      return (
        <g fill="white">
          <circle cx="32" cy="20" r="9" fillOpacity="0.85" />
          <circle cx="21" cy="40" r="9" fillOpacity="0.6" />
          <circle cx="43" cy="40" r="9" fillOpacity="0.6" />
        </g>
      )
    case "arc":
      return (
        <g fill="none" stroke="white" strokeWidth="5" strokeLinecap="round">
          <path d="M14 46a18 18 0 0 1 36 0" strokeOpacity="0.85" />
          <path d="M24 46a8 8 0 0 1 16 0" strokeOpacity="0.5" />
        </g>
      )
  }
}

export function PresetAvatar({
  preset,
  className,
}: {
  preset: AvatarPreset
  className?: string
}) {
  const gradientId = `avatar-${preset.id}`
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={`${preset.name} avatar`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={preset.from} />
          <stop offset="100%" stopColor={preset.to} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="32" fill={`url(#${gradientId})`} />
      <Motif motif={preset.motif} />
    </svg>
  )
}
