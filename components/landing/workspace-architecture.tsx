"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * The workspace drawn as an architecture diagram: eight surfaces wired back to
 * ARTHA at the centre, a pulse of colour running down each wire from the dot
 * at its outer end.
 *
 * Structure is adapted from @gammaui/cpu-architecture. The wires are drawn in
 * SVG so they can be masked and animated along their own path; the labels are
 * real links laid over the top rather than SVG <text>, so they get proper
 * typography, hover states and client-side navigation.
 */

interface Surface {
  href: string
  label: string
  /** Where the wire starts, in the SVG's 200×100 coordinate space. */
  x: number
  y: number
  /** Which side of the dot the label sits on. */
  side: "left" | "right" | "top" | "bottom"
  /** The wire, from the dot to the edge of the centre block. */
  d: string
}

const SURFACES: Surface[] = [
  {
    href: "/demo?next=/dashboard",
    label: "Dashboard",
    x: 10,
    y: 20,
    side: "left",
    d: "M 10 20 h 79.5 q 5 0 5 5 v 15",
  },
  {
    href: "/demo?next=/entries",
    label: "Entries",
    x: 10,
    y: 50,
    side: "left",
    d: "M 10 50 h 75",
  },
  {
    href: "/demo?next=/p2p",
    label: "Fiat/P2P",
    x: 10,
    y: 80,
    side: "left",
    d: "M 10 80 h 79.5 q 5 0 5 -5 v -15",
  },
  {
    href: "/demo?next=/portfolio",
    label: "Portfolio",
    x: 190,
    y: 20,
    side: "right",
    d: "M 190 20 h -79.7 q -5 0 -5 5 v 15",
  },
  {
    href: "/demo?next=/analytics",
    label: "Analytics",
    x: 190,
    y: 50,
    side: "right",
    d: "M 190 50 h -75",
  },
  {
    href: "/demo?next=/goals",
    label: "Goals",
    x: 190,
    y: 80,
    side: "right",
    d: "M 190 80 h -79.7 q -5 0 -5 -5 v -15",
  },
  {
    href: "/demo?next=/heatmap",
    label: "Heatmap",
    x: 100,
    y: 6,
    side: "top",
    d: "M 100 6 v 34",
  },
  {
    href: "/demo?next=/reports",
    label: "Reports",
    x: 100,
    y: 94,
    side: "bottom",
    d: "M 100 94 v -34",
  },
]

// Cycles the theme's chart tokens, so each pulse is a different colour without
// a single hex value being written here.
const PULSE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-3)",
]

/** Positions a label against its dot, just outside the wire. */
function labelPosition(surface: Surface): React.CSSProperties {
  const left = `${(surface.x / 200) * 100}%`
  const top = `${(surface.y / 100) * 100}%`

  if (surface.side === "left") {
    return { left, top, transform: "translate(-100%, -50%)", paddingRight: 14 }
  }
  if (surface.side === "right") {
    return { left, top, transform: "translate(0, -50%)", paddingLeft: 14 }
  }
  if (surface.side === "top") {
    return { left, top, transform: "translate(-50%, -100%)", paddingBottom: 10 }
  }
  return { left, top, transform: "translate(-50%, 0)", paddingTop: 10 }
}

export function WorkspaceArchitecture() {
  return (
    <>
      {/* The diagram needs room on both sides for its labels, so below md it
          gives way to a plain grid of the same links. */}
      <div className="relative mx-auto hidden w-full max-w-4xl px-24 md:block lg:px-28">
        <div className="relative aspect-[2/1]">
          <svg
            viewBox="0 0 200 100"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden
          >
            {/* Wires, with a dot at the outer end of each. */}
            <g
              stroke="var(--border)"
              fill="none"
              strokeWidth="0.35"
              markerStart="url(#artha-wire-dot)"
            >
              {SURFACES.map((surface) => (
                <path key={surface.href} d={surface.d} />
              ))}
            </g>

            {/* One travelling light per wire, clipped to the wire it rides. */}
            {SURFACES.map((surface, index) => (
              <g key={surface.href} mask={`url(#artha-wire-mask-${index})`}>
                <circle
                  className={cn("artha-wire", `artha-wire-${index + 1}`)}
                  cx="0"
                  cy="0"
                  r="7"
                  fill={`url(#artha-wire-glow-${index})`}
                />
              </g>
            ))}

            {/* The centre block. */}
            <rect
              x="84"
              y="40"
              width="32"
              height="20"
              rx="3"
              fill="var(--card)"
              stroke="var(--border)"
              strokeWidth="0.4"
            />
            <text
              x="100"
              y="52.4"
              textAnchor="middle"
              fontSize="7"
              fontWeight="600"
              letterSpacing="0.12em"
              fill="var(--foreground)"
            >
              ARTHA
            </text>

            <defs>
              {SURFACES.map((surface, index) => (
                <mask
                  key={surface.href}
                  id={`artha-wire-mask-${index}`}
                  maskUnits="userSpaceOnUse"
                >
                  <path d={surface.d} strokeWidth="0.6" stroke="white" />
                </mask>
              ))}
              {SURFACES.map((surface, index) => (
                <radialGradient
                  key={surface.href}
                  id={`artha-wire-glow-${index}`}
                  fx="1"
                >
                  <stop offset="0%" stopColor={PULSE_COLORS[index]} />
                  <stop
                    offset="55%"
                    stopColor={PULSE_COLORS[index]}
                    stopOpacity="0.55"
                  />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              ))}
              <marker
                id="artha-wire-dot"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="7"
                markerHeight="7"
              >
                <circle
                  cx="5"
                  cy="5"
                  r="2.6"
                  fill="var(--background)"
                  stroke="var(--muted-foreground)"
                  strokeWidth="1"
                />
              </marker>
            </defs>
          </svg>

          {/* Labels sit over the diagram so they can be real links. */}
          {SURFACES.map((surface) => (
            <Link
              key={surface.href}
              href={surface.href}
              style={labelPosition(surface)}
              className="absolute text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              {surface.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Below md: the same eight surfaces, plainly. */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {SURFACES.map((surface) => (
          <Link
            key={surface.href}
            href={surface.href}
            className="rounded-lg border bg-card/60 px-4 py-3 text-sm font-medium transition-colors hover:border-foreground/20"
          >
            {surface.label}
          </Link>
        ))}
      </div>
    </>
  )
}
