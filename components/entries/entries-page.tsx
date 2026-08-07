"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
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
import { formatMoney, getNetAmount } from "@/lib/mock-data"
import { useSettings } from "@/lib/use-settings"
import { useEntryData } from "@/lib/use-entry-data"
import type { Entry } from "@/lib/types"
import { tagStyle } from "@/lib/tag-colors"
import { cn } from "@/lib/utils"

type RangePreset = "all" | "7d" | "30d" | "month" | "year" | "custom"

const rangeItems: { value: RangePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" },
]

function rangeBounds(
  preset: RangePreset,
  customFrom: string,
  customTo: string,
  now = new Date()
): { from?: Date; to?: Date } {
  if (preset === "all") return {}
  if (preset === "7d") return { from: new Date(now.getTime() - 7 * 86_400_000) }
  if (preset === "30d")
    return { from: new Date(now.getTime() - 30 * 86_400_000) }
  if (preset === "month")
    return { from: new Date(now.getFullYear(), now.getMonth(), 1) }
  if (preset === "year") return { from: new Date(now.getFullYear(), 0, 1) }
  return {
    from: customFrom ? new Date(`${customFrom}T00:00:00`) : undefined,
    to: customTo ? new Date(`${customTo}T23:59:59`) : undefined,
  }
}

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
  // Subscribing re-renders every amount when the display currency changes.
  useSettings()
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

  // The header search sends people here with ?q=… . Mirroring the param into
  // state during render (rather than in an effect) keeps the box editable
  // afterwards while still following later navigations.
  const urlQuery = useSearchParams().get("q") ?? ""
  const [search, setSearch] = React.useState(urlQuery)
  const [lastUrlQuery, setLastUrlQuery] = React.useState(urlQuery)
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery)
    setSearch(urlQuery)
  }
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [sourceFilter, setSourceFilter] = React.useState<string>("all")
  const [tagFilter, setTagFilter] = React.useState<string>("all")
  const [range, setRange] = React.useState<RangePreset>("all")
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")

  const sourceById = React.useMemo(
    () => new Map(sources.map((s) => [s.id, s])),
    [sources]
  )

  const hasActiveFilters =
    search !== "" ||
    typeFilter !== "all" ||
    sourceFilter !== "all" ||
    tagFilter !== "all" ||
    range !== "all"

  const filtered = React.useMemo(() => {
    const { from, to } = rangeBounds(range, customFrom, customTo)
    const q = search.trim().toLowerCase()
    return entries
      .filter((entry) => {
        if (typeFilter !== "all" && entry.type !== typeFilter) return false
        if (sourceFilter !== "all" && entry.sourceId !== sourceFilter)
          return false
        if (tagFilter !== "all" && !entry.tags.includes(tagFilter)) return false
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
      .sort((a, b) => b.datetime.localeCompare(a.datetime))
  }, [
    entries,
    search,
    typeFilter,
    sourceFilter,
    tagFilter,
    range,
    customFrom,
    customTo,
    sourceById,
  ])

  const netTotal = filtered.reduce((sum, e) => sum + getNetAmount(e), 0)

  function clearFilters() {
    setSearch("")
    setTypeFilter("all")
    setSourceFilter("all")
    setTagFilter("all")
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
    setEntries((prev) => [{ ...entry, id: `e_${Date.now()}` }, ...prev])
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
  const tagFilterItems = [
    { value: "all", label: "All tags" },
    ...tagOptions.map((t) => ({ value: t, label: t })),
  ]

  return (
    <AppShell>
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
          value={range}
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
        {range === "custom" ? (
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
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Note</TableHead>
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
                const hasDetail =
                  Boolean(entry.note) || (entry.attachments?.length ?? 0) > 0
                const isOpen = expanded === entry.id
                return (
                  <React.Fragment key={entry.id}>
                    <TableRow>
                      <TableCell className="pr-0">
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
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
                        <div className="flex flex-col">
                          <span className="font-medium">{date}</span>
                          <span className="text-xs text-muted-foreground">
                            {time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {entryTypeLabels[entry.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.category ?? "—"}</TableCell>
                      <TableCell>{source?.name ?? "—"}</TableCell>
                      <TableCell>
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
                      <TableCell className="max-w-48">
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
                            <span className="text-xs text-muted-foreground">
                              {entry.p2p.direction === "usd-to-cash"
                                ? "Sold USD"
                                : "Bought USD"}
                              {" · "}
                              {entry.p2p.cashCurrency}{" "}
                              {entry.p2p.cashAmount.toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                              })}
                              {" @ "}
                              {entry.p2p.rate}
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
                      <EntryDetailRow entry={entry} colSpan={9} />
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
