"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "@/components/icons"
import {
  ArrowDataTransferHorizontalIcon,
  HashIcon,
  Store01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import { NavIcon } from "@/components/layout/nav-icon"
import { NavIconButton } from "@/components/layout/nav-icon-button"
import { NAV_ITEMS } from "@/lib/nav-config"
import { useEntryData } from "@/lib/use-entry-data"
import { useMoney } from "@/lib/use-money"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  group: string
  title: string
  subtitle?: string
  href: string
  icon: IconSvgElement
}

const GROUP_ORDER = ["Pages", "Entries", "Categories", "Sources", "Tags"]

/** Search that lives in the header and opens out over the breadcrumb. */
export function NavSearch() {
  const router = useRouter()
  const { formatMoney } = useMoney()
  const { entries, sources, categoryOptions, tagOptions } = useEntryData()

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const sourceById = React.useMemo(
    () => new Map(sources.map((source) => [source.id, source])),
    [sources]
  )

  const results = React.useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const found: SearchResult[] = []

    for (const item of NAV_ITEMS) {
      if (item.title.toLowerCase().includes(q)) {
        found.push({
          id: `page-${item.href}`,
          group: "Pages",
          title: item.title,
          subtitle: "Go to page",
          href: item.href,
          icon: item.icon,
        })
      }
    }

    for (const category of categoryOptions) {
      if (category.toLowerCase().includes(q)) {
        found.push({
          id: `cat-${category}`,
          group: "Categories",
          title: category,
          subtitle: "Category",
          href: `/entries?q=${encodeURIComponent(category)}`,
          icon: HashIcon,
        })
      }
    }

    for (const source of sources) {
      if (
        source.name.toLowerCase().includes(q) ||
        source.socialHandle?.toLowerCase().includes(q)
      ) {
        found.push({
          id: `src-${source.id}`,
          group: "Sources",
          title: source.name,
          subtitle: source.socialHandle ?? "Source",
          href: `/entries?q=${encodeURIComponent(source.name)}`,
          icon: Store01Icon,
        })
      }
    }

    for (const tag of tagOptions) {
      if (tag.toLowerCase().includes(q)) {
        found.push({
          id: `tag-${tag}`,
          group: "Tags",
          title: tag,
          subtitle: "Tag",
          href: `/entries?q=${encodeURIComponent(tag)}`,
          icon: Tag01Icon,
        })
      }
    }

    for (const entry of entries) {
      const source = entry.sourceId ? sourceById.get(entry.sourceId) : undefined
      const haystack = [
        entry.note,
        entry.category,
        entry.type,
        source?.name,
        ...entry.tags,
        String(entry.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (!haystack.includes(q)) continue

      const term = entry.note || entry.category || entry.type
      found.push({
        id: `entry-${entry.id}`,
        group: "Entries",
        title: entry.note || entry.category || "Entry",
        subtitle: `${entry.datetime.slice(0, 10)} · ${formatMoney(entry.amount, "USD")}${source ? ` · ${source.name}` : ""}`,
        href: `/entries?q=${encodeURIComponent(term)}`,
        icon: ArrowDataTransferHorizontalIcon,
      })
    }

    // A handful from each group, in a stable order, so nothing swamps the list.
    return GROUP_ORDER.flatMap((group) =>
      found.filter((item) => item.group === group).slice(0, 5)
    )
  }, [
    query,
    entries,
    sources,
    sourceById,
    categoryOptions,
    tagOptions,
    formatMoney,
  ])

  const close = React.useCallback(() => {
    setOpen(false)
    setQuery("")
    setActive(0)
  }, [])

  function go(result: SearchResult) {
    close()
    router.push(result.href)
  }

  // Focus on open, and close again on a click anywhere outside.
  React.useEffect(() => {
    if (!open) return
    inputRef.current?.focus()

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open, close])

  // ⌘K / Ctrl+K from anywhere in the app.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      close()
      return
    }
    if (results.length === 0) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive((index) => (index + 1) % results.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((index) => (index - 1 + results.length) % results.length)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const result = results[Math.min(active, results.length - 1)]
      if (result) go(result)
    }
  }

  // Grouped for display, but each item keeps its index in the flat list so
  // arrow-key navigation runs straight through the sections.
  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: results
      .map((result, index) => ({ result, index }))
      .filter((entry) => entry.result.group === group),
  })).filter((section) => section.items.length > 0)

  return (
    <div ref={rootRef} className="relative">
      <div
        data-open={open}
        className={cn(
          "flex h-9 items-center overflow-hidden rounded-xl",
          "transition-[width,background-color,box-shadow] duration-300 ease-out",
          open
            ? "w-[min(24rem,55vw)] border bg-muted/50 pr-1 pl-2.5 shadow-sm"
            : "w-9"
        )}
      >
        {open ? (
          <Search className="size-[18px] shrink-0 text-muted-foreground" />
        ) : (
          <NavIconButton label="Search" onClick={() => setOpen(true)}>
            <Search />
          </NavIconButton>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search entries, categories, pages…"
          aria-label="Search"
          tabIndex={open ? 0 : -1}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onInputKeyDown}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground",
            !open && "pointer-events-none w-0 opacity-0"
          )}
        />

        {open ? (
          <button
            type="button"
            aria-label="Close search"
            onClick={close}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {open && query.trim() ? (
        <div className="absolute top-11 right-0 z-50 w-[min(26rem,80vw)] animate-in overflow-hidden rounded-xl border bg-popover p-1 shadow-lg duration-200 fade-in-0 zoom-in-95">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {groups.map((section) => (
                <div key={section.group}>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                    {section.group}
                  </div>
                  {section.items.map(({ result, index }) => (
                    <button
                      key={result.id}
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(result)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        index === active ? "bg-accent" : "hover:bg-accent/60"
                      )}
                    >
                      <span className="size-4 shrink-0 text-muted-foreground">
                        <NavIcon icon={result.icon} />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{result.title}</span>
                        {result.subtitle ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
