"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeftRight,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  HelpCircle,
  Info,
  LayoutDashboard,
  LineChart,
  Mail,
  PanelLeft,
  Settings,
  Target,
  User,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SITE } from "@/lib/site"
import {
  SIDEBAR_MODES,
  type SidebarMode,
} from "@/lib/use-sidebar-mode"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

interface NavSection {
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Entries", href: "/entries", icon: ArrowUpDown },
      { title: "Fiat/P2P", href: "/p2p", icon: ArrowLeftRight },
      { title: "Portfolio", href: "/portfolio", icon: LineChart },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Planning",
    items: [
      { title: "Goals", href: "/goals", icon: Target },
      { title: "Year Heatmap", href: "/heatmap", icon: CalendarDays },
      { title: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", href: "/profile", icon: User },
      { title: "Billing", href: "#", icon: CreditCard },
      { title: "Settings", href: "#", icon: Settings },
    ],
  },
  {
    title: "Support",
    items: [
      { title: "Help Center", href: "#", icon: HelpCircle },
      { title: "Contact Us", href: "#", icon: Mail },
      { title: "About Us", href: "#", icon: Info },
    ],
  },
]

interface AppSidebarProps {
  mode: SidebarMode
  onModeChange: (mode: SidebarMode) => void
  expanded: boolean
  onHoverChange: (hovering: boolean) => void
}

export function AppSidebar({
  mode,
  onModeChange,
  expanded,
  onHoverChange,
}: AppSidebarProps) {
  const pathname = usePathname()
  const navRef = React.useRef<HTMLDivElement>(null)
  const pillRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef(new Map<string, HTMLAnchorElement>())
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null)

  const activeKey = React.useMemo(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.href !== "#" && pathname.startsWith(item.href)) {
          return `${section.title}:${item.title}`
        }
      }
    }
    return null
  }, [pathname])

  // The pill is positioned by mutating the DOM directly rather than through
  // state — it runs on every hover, and re-rendering the whole nav for an
  // animation frame would be wasteful.
  const positionPill = React.useCallback(() => {
    const pill = pillRef.current
    const nav = navRef.current
    if (!pill || !nav) return

    const targetKey = hoveredKey ?? activeKey
    const target = targetKey ? itemRefs.current.get(targetKey) : undefined

    if (!target) {
      pill.style.opacity = "0"
      return
    }

    const navBox = nav.getBoundingClientRect()
    const box = target.getBoundingClientRect()
    if (box.height === 0) return // not laid out yet; a later pass will catch it

    pill.style.transform = `translateY(${box.top - navBox.top + nav.scrollTop}px)`
    pill.style.height = `${box.height}px`
    pill.style.opacity = "1"
  }, [hoveredKey, activeKey])

  React.useLayoutEffect(() => {
    positionPill()
    // The first pass can land before layout settles, and the width transition
    // shifts rows, so re-measure on the next frame and once it has finished.
    const frame = requestAnimationFrame(positionPill)
    const settled = window.setTimeout(positionPill, 320)
    window.addEventListener("resize", positionPill)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settled)
      window.removeEventListener("resize", positionPill)
    }
  }, [positionPill, expanded, mode])

  return (
    <aside
      data-expanded={expanded}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => {
        onHoverChange(false)
        setHoveredKey(null)
      }}
      className={cn(
        "group/sidebar sticky top-0 z-30 hidden h-svh shrink-0 flex-col border-r bg-sidebar md:flex",
        "transition-[width] duration-300 ease-out",
        expanded ? "w-64" : "w-[68px]"
      )}
    >
      <div className="flex h-16 items-center gap-2 px-3">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2 overflow-hidden"
        >
          <Image
            src={SITE.logoPath}
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-lg object-contain"
            priority
          />
          <div
            className={cn(
              "flex min-w-0 flex-col transition-all duration-200",
              expanded
                ? "translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-2 opacity-0"
            )}
          >
            <span className="truncate text-xs font-semibold tracking-[0.2em] text-sidebar-foreground">
              {SITE.name}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              {SITE.tagline}
            </span>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sidebar display options"
                className={cn(
                  "ml-auto shrink-0 transition-opacity",
                  expanded ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100"
                )}
              />
            }
          >
            <PanelLeft />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {/* The label must live inside the group — Base UI throws if a
                group part is rendered without a Group ancestor. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sidebar</DropdownMenuLabel>
              {SIDEBAR_MODES.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onModeChange(option.value)}
                >
                  <Check
                    className={cn(option.value !== mode && "invisible")}
                  />
                  <span className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={navRef}
        className="relative flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4"
      >
        {/* Single pill that glides between items instead of one highlight per row. */}
        <div
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 rounded-xl bg-sidebar-accent opacity-0 transition-[transform,height,opacity] duration-300 ease-out"
        />

        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1 pt-4 first:pt-0">
            <span
              className={cn(
                "px-3 text-xs font-medium text-muted-foreground transition-all duration-200",
                expanded
                  ? "h-5 translate-x-0 opacity-100"
                  : "h-0 -translate-x-2 overflow-hidden opacity-0"
              )}
            >
              {section.title}
            </span>

            {section.items.map((item) => {
              const key = `${section.title}:${item.title}`
              const isActive = key === activeKey
              const link = (
                <Link
                  key={key}
                  href={item.href}
                  ref={(node) => {
                    if (node) itemRefs.current.set(key, node)
                    else itemRefs.current.delete(key)
                  }}
                  onMouseEnter={() => setHoveredKey(key)}
                  onFocus={() => setHoveredKey(key)}
                  className={cn(
                    "relative z-10 flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                    isActive
                      ? "font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span
                    className={cn(
                      "truncate transition-all duration-200",
                      expanded
                        ? "translate-x-0 opacity-100"
                        : "pointer-events-none -translate-x-2 opacity-0"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              )

              // Collapsed rows have no label, so the name moves to a tooltip.
              return expanded ? (
                link
              ) : (
                <Tooltip key={key}>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>
    </aside>
  )
}
