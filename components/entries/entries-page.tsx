"use client"

import * as React from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Copy,
  FilterX,
  Inbox,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from "@/components/icons"

import {
  AttachmentCount,
  EntryDetailRow,
} from "@/components/entries/entry-detail-row"
import {
  EntryFormDialog,
  entryTypeLabels,
} from "@/components/entries/entry-form-dialog"
import { AppShell } from "@/components/layout/app-shell"
import { QueryParamSync } from "@/components/layout/query-param-sync"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getEntryYear, getNetAmount } from "@/lib/mock-data"
import { useMoney } from "@/lib/use-money"
import { newId } from "@/lib/id"
import { useEntryData } from "@/lib/use-entry-data"
import type { Entry } from "@/lib/types"
import { tagStyle } from "@/lib/tag-colors"
import { cn } from "@/lib/utils"
import { useSelectedYear } from "@/lib/use-selected-year"

type RangePreset = "all" | "7d" | "30d" | "month" | "custom"

/**
 * The page is scoped to the year on the tabs, so every one of these narrows
 * within that year rather than across the whole ledger. "All time" would be a
 * lie — it is the whole of the year you are looking at.
 *
 * The relative ones are only offered for the year in progress. "Last 7 days"
 * against 2025, viewed from 2026, can only ever come back empty, and an option
 * that cannot return anything is a trap rather than a filter.
 */
function rangeItemsFor(
  selectedYear: number,
  now = new Date()
): { value: RangePreset; label: string }[] {
  const whole = { value: "all" as const, label: "Whole year" }
  const custom = { value: "custom" as const, label: "Custom range" }
  if (selectedYear !== now.getFullYear()) return [whole, custom]
  return [
    whole,
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "month", label: "This month" },
    custom,
  ]
}

function rangeBounds(
  preset: RangePreset,
  customFrom: string,
  customTo: string,
  now = new Date()
): { from?: Date; to?: Date } {
  // Empty: the year filter below already bounds it.
  if (preset === "all") return {}
  if (preset === "7d") return { from: new Date(now.getTime() - 7 * 86_400_000) }
  if (preset === "30d")
    return { from: new Date(now.getTime() - 30 * 86_400_000) }
  if (preset === "month")
    return { from: new Date(now.getFullYear(), now.getMonth(), 1) }
  return {
    from: customFrom ? new Date(`${customFrom}T00:00:00`) : undefined,
    to: customTo ? new Date(`${customTo}T23:59:59`) : undefined,
  }
}

type SortKey = "newest" | "oldest" | "largest" | "smallest"

const sortItems: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "largest", label: "Largest first" },
  { value: "smallest", label: "Smallest first" },
]

/**
 * Date sorts compare the datetime string directly — it is fixed-width and
 * already in year-month-day order, so it sorts correctly as text without
 * parsing anything.
 *
 * Amount sorts fall back to the date so two entries of the same size keep a
 * stable, meaningful order rather than whichever the engine happened to hold.
 */
const comparators: Record<SortKey, (a: Entry, b: Entry) => number> = {
  newest: (a, b) => b.datetime.localeCompare(a.datetime),
  oldest: (a, b) => a.datetime.localeCompare(b.datetime),
  largest: (a, b) =>
    b.amount - a.amount || b.datetime.localeCompare(a.datetime),
  smallest: (a, b) =>
    a.amount - b.amount || b.datetime.localeCompare(a.datetime),
}

/** Entries filed under nothing, which is worth being able to find. */
const NO_CATEGORY = "__none__"

function formatEntryDate(datetime: string): { date: string; time: string } {
  const d = new Date(datetime)
  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(d),
  }
}

function AmountCell({ entry }: { entry: Entry }) {
  const { formatMoney } = useMoney()
  const net = getNetAmount(entry)
  const formatted = formatMoney(entry.amount, "USD")
  if (net > 0) {
    return <span className="font-medium text-success">+{formatted}</span>
  }
  if (net < 0) {
    return <span className="font-medium text-destructive">−{formatted}</span>
  }
  return <span className="font-medium">{formatted}</span>
}

export function EntriesPage() {
  const { formatMoney, formatCash, formatPlain } = useMoney()
  const {
    entries,
    setEntries,
    sources,
    categoryOptions,
    tagOptions,
    saveEntry,
  } = useEntryData()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Entry | null>(null)
  // One row open at a time, so the table doesn't sprawl.
  const [expanded, setExpanded] = React.useState<string | null>(null)

  // The header search sends people here with ?q=… . The param is read by the
  // QueryParamSync leaf near the bottom of the tree, which hands it here —
  // the box stays editable afterwards and still follows later navigations.
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [sourceFilter, setSourceFilter] = React.useState<string>("all")
  const [tagFilter, setTagFilter] = React.useState<string>("all")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [sort, setSort] = React.useState<SortKey>("newest")
  const [selectedYear] = useSelectedYear()
  const [range, setRange] = React.useState<RangePreset>("all")
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")

  const sourceById = React.useMemo(
    () => new Map(sources.map((s) => [s.id, s])),
    [sources]
  )

  const rangeItems = React.useMemo(
    () => rangeItemsFor(selectedYear),
    [selectedYear]
  )
  // Switching from this year to a past one takes "Last 7 days" off the list.
  // Derived rather than corrected in an effect, so there is never a render
  // where the filter says one thing and the table shows another.
  const effectiveRange = rangeItems.some((item) => item.value === range)
    ? range
    : "all"

  const hasActiveFilters =
    search !== "" ||
    typeFilter !== "all" ||
    sourceFilter !== "all" ||
    tagFilter !== "all" ||
    categoryFilter !== "all" ||
    effectiveRange !== "all"

  const filtered = React.useMemo(() => {
    const { from, to } = rangeBounds(effectiveRange, customFrom, customTo)
    const q = search.trim().toLowerCase()
    return entries
      .filter((entry) => {
        // The year on the tabs scopes this page, the same as every other.
        // Without it the table listed all three years at once under a heading
        // that named one, and the total underneath added up a period nobody
        // had asked to see.
        if (getEntryYear(entry) !== selectedYear) return false
        if (typeFilter !== "all" && entry.type !== typeFilter) return false
        if (sourceFilter !== "all" && entry.sourceId !== sourceFilter)
          return false
        if (tagFilter !== "all" && !entry.tags.includes(tagFilter)) return false
        if (categoryFilter === NO_CATEGORY) {
          if (entry.category) return false
        } else if (
          categoryFilter !== "all" &&
          entry.category !== categoryFilter
        ) {
          return false
        }
        const when = new Date(entry.datetime)
        if (from && when < from) return false
        if (to && when > to) return false
        if (q) {
          const source = entry.sourceId
            ? (sourceById.get(entry.sourceId)?.name ?? "")
            : ""
          const haystack = [
            entry.category ?? "",
            entry.note ?? "",
            source,
            entryTypeLabels[entry.type],
            ...entry.tags,
          ]
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      })
      .sort(comparators[sort])
  }, [
    entries,
    search,
    typeFilter,
    sourceFilter,
    tagFilter,
    categoryFilter,
    sort,
    effectiveRange,
    customFrom,
    customTo,
    selectedYear,
    sourceById,
  ])

  const netTotal = filtered.reduce((sum, e) => sum + getNetAmount(e), 0)

  function clearFilters() {
    setSearch("")
    setTypeFilter("all")
    setSourceFilter("all")
    setTagFilter("all")
    setCategoryFilter("all")
    setRange("all")
    setCustomFrom("")
    setCustomTo("")
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(entry: Entry) {
    setEditing(entry)
    setDialogOpen(true)
  }

  function handleDelete(entry: Entry) {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
  }

  function handleDuplicate(entry: Entry) {
    setEntries((prev) => [{ ...entry, id: newId() }, ...prev])
  }

  const typeFilterItems = [
    { value: "all", label: "All types" },
    ...Object.entries(entryTypeLabels).map(([value, label]) => ({
      value,
      label,
    })),
  ]
  const sourceFilterItems = [
    { value: "all", label: "All sources" },
    ...sources.map((s) => ({ value: s.id, label: s.name })),
  ]
  const categoryFilterItems = [
    { value: "all", label: "All categories" },
    { value: NO_CATEGORY, label: "No category" },
    ...categoryOptions.map((c) => ({ value: c, label: c })),
  ]
  const tagFilterItems = [
    { value: "all", label: "All tags" },
    ...tagOptions.map((t) => ({ value: t, label: t })),
  ]

  return (
    <AppShell>
      {/* Renders nothing. Confined to its own boundary so reading the query
          string cannot stop the rest of the page hydrating. */}
      <React.Suspense fallback={null}>
        <QueryParamSync name="q" onChange={setSearch} />
      </React.Suspense>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Entries
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Entries</h1>
        </div>
        <InteractiveHoverButton onClick={openCreate}>
          Add Entry
        </InteractiveHoverButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-full sm:max-w-56">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search entries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Select
          items={typeFilterItems}
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as string)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {typeFilterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          items={sourceFilterItems}
          value={sourceFilter}
          onValueChange={(v) => setSourceFilter(v as string)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {sourceFilterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          items={categoryFilterItems}
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as string)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categoryFilterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          items={tagFilterItems}
          value={tagFilter}
          onValueChange={(v) => setTagFilter(v as string)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {tagFilterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          items={rangeItems}
          value={effectiveRange}
          onValueChange={(v) => setRange(v as RangePreset)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {rangeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Not a filter: it changes the order, never the contents, which is
            why it sits apart from them and Clear leaves it alone. */}
        <Select
          items={sortItems}
          value={sort}
          onValueChange={(v) => setSort(v as SortKey)}
        >
          <SelectTrigger className="w-36" aria-label="Sort entries">
            <ArrowUpDown className="size-3.5 opacity-60" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {sortItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {effectiveRange === "custom" ? (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="From date"
              className="w-36"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              aria-label="To date"
              className="w-36"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        ) : null}
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <FilterX data-icon="inline-start" />
            Clear
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </span>
        <span>·</span>
        <span>
          Net:{" "}
          <span
            className={cn(
              "font-medium",
              netTotal > 0 && "text-success",
              netTotal < 0 && "text-destructive"
            )}
          >
            {netTotal > 0 ? "+" : netTotal < 0 ? "−" : ""}
            {formatMoney(Math.abs(netTotal), "USD")}
          </span>
        </span>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No entries found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? "Try changing or clearing the filters above."
                : "Add your first entry to get started."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              {/* Nine columns need about 1,150px. On a phone that left a third
                  of a row on screen and the rest behind a sideways drag, which
                  is no way to read a ledger. Below md the middle columns fold
                  away and their content reappears stacked under the date, so
                  nothing is lost and the row fits the screen. */}
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Date</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="hidden 2xl:table-cell">Tags</TableHead>
                <TableHead className="hidden 2xl:table-cell">Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => {
                const { date, time } = formatEntryDate(entry.datetime)
                const source = entry.sourceId
                  ? sourceById.get(entry.sourceId)
                  : undefined
                // A source carrying a handle or a link is worth opening for, even on
                // an entry with no note — otherwise those links have nowhere to
                // be seen on most rows.
                const hasSourceDetail = Boolean(
                  source?.socialHandle ||
                  source?.platformUrl ||
                  source?.campaignUrl
                )
                const hasDetail =
                  Boolean(entry.note) ||
                  (entry.attachments?.length ?? 0) > 0 ||
                  hasSourceDetail
                const isOpen = expanded === entry.id
                return (
                  <React.Fragment key={entry.id}>
                    <TableRow>
                      <TableCell className="px-1 sm:pr-0 sm:pl-3">
                        {hasDetail ? (
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-label={
                              isOpen
                                ? "Hide note and images"
                                : "Show note and images"
                            }
                            onClick={() =>
                              setExpanded(isOpen ? null : entry.id)
                            }
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:size-6"
                          >
                            <ChevronDown
                              className={cn(
                                "size-4 transition-transform duration-200",
                                isOpen && "rotate-180"
                              )}
                            />
                          </button>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[8.25rem] flex-col sm:max-w-none">
                          <span className="font-medium">{date}</span>
                          <span className="text-xs text-muted-foreground">
                            {time}
                          </span>
                          {/* What the hidden columns were carrying, folded in
                              underneath on the sizes where they are gone. */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1 lg:hidden">
                            <Badge variant="secondary">
                              {entryTypeLabels[entry.type]}
                            </Badge>
                            {entry.category ? (
                              <span className="text-xs text-muted-foreground">
                                {entry.category}
                              </span>
                            ) : null}
                            {source?.name ? (
                              <span className="text-xs text-muted-foreground">
                                · {source.name}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 2xl:hidden">
                            {entry.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                                style={tagStyle(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags.length > 2 ? (
                              <span className="text-[10px] text-muted-foreground">
                                +{entry.tags.length - 2}
                              </span>
                            ) : null}
                            <AttachmentCount entry={entry} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary">
                          {entryTypeLabels[entry.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {entry.category ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {source?.name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden 2xl:table-cell">
                        {entry.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {/* Each tag keeps its own colour, derived from its
                              text so it never changes between renders. */}
                            {entry.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                style={tagStyle(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags.length > 2 ? (
                              <Badge variant="outline">
                                +{entry.tags.length - 2}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-48 2xl:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-muted-foreground">
                            {entry.note ?? "—"}
                          </span>
                          <AttachmentCount entry={entry} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <AmountCell entry={entry} />
                          {entry.p2p ? (
                            // Table cells never wrap, so this one line was
                            // holding the amount column open at 247px on a
                            // 341px screen. It wraps below md instead.
                            <span className="max-w-[8.5rem] text-xs whitespace-normal text-muted-foreground lg:max-w-none lg:whitespace-nowrap">
                              {entry.p2p.direction === "usd-to-cash"
                                ? "Sold USD"
                                : "Bought USD"}
                              {" · "}
                              {formatCash(
                                entry.p2p.cashAmount,
                                entry.p2p.cashCurrency
                              )}
                              {" @ "}
                              {formatPlain(entry.p2p.rate)}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Entry options"
                              />
                            }
                          >
                            <MoreVertical />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => openEdit(entry)}>
                                <Pencil />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(entry)}
                              >
                                <Copy />
                                Duplicate
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(entry)}
                              >
                                <Trash2 />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isOpen ? (
                      <EntryDetailRow
                        entry={entry}
                        colSpan={9}
                        source={source}
                      />
                    ) : null}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <EntryFormDialog
        key={dialogOpen ? (editing?.id ?? "create") : "closed"}
        entry={editing}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        sources={sources}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        onSave={saveEntry}
      />
    </AppShell>
  )
}
