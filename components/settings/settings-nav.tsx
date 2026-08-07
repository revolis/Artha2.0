"use client"

import * as React from "react"
import type { AppIcon } from "@/components/icons"

import { cn } from "@/lib/utils"

export interface SettingsNavItem {
  id: string
  label: string
  icon: AppIcon
  destructive?: boolean
  /** Starts a new group, drawn with a divider above it. */
  startsGroup?: boolean
}

interface SettingsNavProps {
  items: SettingsNavItem[]
  active: string
  onSelect: (id: string) => void
}

export function SettingsNav({ items, active, onSelect }: SettingsNavProps) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const pillRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const [hovered, setHovered] = React.useState<string | null>(null)

  // Positioned by mutating the DOM rather than through state — this runs on
  // every hover and re-rendering the list each frame would be wasteful.
  const positionPill = React.useCallback(() => {
    const pill = pillRef.current
    const list = listRef.current
    if (!pill || !list) return

    const target = itemRefs.current.get(hovered ?? active)
    if (!target) {
      pill.style.opacity = "0"
      return
    }

    const listBox = list.getBoundingClientRect()
    const box = target.getBoundingClientRect()
    if (box.height === 0) return // not laid out yet; a later pass catches it

    pill.style.transform = `translate(${box.left - listBox.left}px, ${box.top - listBox.top}px)`
    pill.style.width = `${box.width}px`
    pill.style.height = `${box.height}px`
    pill.style.opacity = "1"
  }, [hovered, active])

  React.useLayoutEffect(() => {
    positionPill()
    // The first pass can land before layout settles, so measure again.
    const frame = requestAnimationFrame(positionPill)
    const settled = window.setTimeout(positionPill, 200)
    window.addEventListener("resize", positionPill)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settled)
      window.removeEventListener("resize", positionPill)
    }
  }, [positionPill])

  return (
    <div
      ref={listRef}
      onMouseLeave={() => setHovered(null)}
      className="relative flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      <div
        ref={pillRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 rounded-xl bg-muted opacity-0 transition-[transform,width,height,opacity] duration-300 ease-out"
      />

      {items.map((item) => {
        const isActive = item.id === active
        return (
          <React.Fragment key={item.id}>
            {item.startsGroup ? (
              <div
                aria-hidden
                className="my-1 hidden h-px shrink-0 bg-border lg:block"
              />
            ) : null}
            <button
              type="button"
              ref={(node) => {
                if (node) itemRefs.current.set(item.id, node)
                else itemRefs.current.delete(item.id)
              }}
              onClick={() => onSelect(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onFocus={() => setHovered(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative z-10 flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                item.destructive && isActive && "text-destructive",
                item.destructive && !isActive && "hover:text-destructive"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
}
