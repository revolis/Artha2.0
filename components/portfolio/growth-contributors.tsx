"use client"

import * as React from "react"
import { Search, TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatMoney } from "@/lib/mock-data"
import type { Contributor } from "@/lib/portfolio"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 5

type Filter = "all" | "category" | "source" | "drainers"

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "category", label: "Categories" },
  { value: "source", label: "Sources" },
  { value: "drainers", label: "Drainers" },
]

// Two letters from a multi-word name, otherwise the first three characters.
function initials(name: string): string {
  const words = name.replace(/[^\w\s]/g, " ").trim().split(/\s+/)
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 3).toUpperCase()
}

function formatMonth(datetime: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  })
    .format(new Date(datetime))
    .toUpperCase()
}

export function GrowthContributors({ items }: { items: Contributor[] }) {
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [visible, setVisible] = React.useState(PAGE_SIZE)

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return items
      .filter((item) => {
        if (filter === "drainers" && item.net >= 0) return false
        if (
          (filter === "category" || filter === "source") &&
          item.kind !== filter
        ) {
          return false
        }
        if (query && !item.name.toLowerCase().includes(query)) return false
        return true
      })
      // Biggest movers first in either direction, so the heaviest drainers
      // surface next to the strongest contributors.
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
  }, [items, search, filter])

  // Collapse back to one page whenever the list being shown changes.
  function changeSearch(value: string) {
    setSearch(value)
    setVisible(PAGE_SIZE)
  }

  function changeFilter(value: Filter) {
    setFilter(value)
    setVisible(PAGE_SIZE)
  }

  const shown = filtered.slice(0, visible)
  const remaining = filtered.length - shown.length
  const gainers = items.filter((item) => item.net > 0).length
  const drainers = items.filter((item) => item.net < 0).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio growth contributors</CardTitle>
        <CardDescription>
          {gainers} adding · {drainers} draining · ranked by impact this year
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <InputGroup className="w-full sm:max-w-72">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search contributors..."
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
            />
          </InputGroup>
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[filter]}
            onValueChange={(value: string[]) => {
              if (value[0]) changeFilter(value[0] as Filter)
            }}
          >
            {filters.map((item) => (
              <ToggleGroupItem key={item.value} value={item.value}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {shown.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No contributors found</EmptyTitle>
              <EmptyDescription>
                Try a different search or filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {shown.map((item) => {
              const positive = item.net >= 0
              return (
                <div
                  key={`${item.kind}-${item.name}`}
                  className="flex items-center gap-4 rounded-2xl bg-muted/50 p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-sm font-semibold">
                    {initials(item.name)}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="text-xs tracking-wide text-muted-foreground uppercase">
                      {item.count} {item.count === 1 ? "entry" : "entries"} ·{" "}
                      {formatMonth(item.lastDate)}
                    </span>
                  </div>
                  {/* Always visible: a category and a source can share a name,
                      and this is what tells the two rows apart. */}
                  <Badge variant="outline">
                    {item.kind === "category" ? "Category" : "Source"}
                  </Badge>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="text-xs tracking-wide text-muted-foreground uppercase">
                      Impact
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 font-semibold tabular-nums",
                        positive ? "text-success" : "text-destructive"
                      )}
                    >
                      {positive ? (
                        <TrendingUp className="size-3.5" />
                      ) : (
                        <TrendingDown className="size-3.5" />
                      )}
                      {positive ? "+" : "−"}
                      {formatMoney(Math.abs(item.net), "USD")}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {remaining > 0 ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setVisible((prev) => prev + PAGE_SIZE)}
          >
            Load more ({remaining} left)
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
