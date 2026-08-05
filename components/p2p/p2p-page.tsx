"use client"

import * as React from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  MoreVertical,
  Paperclip,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react"

import { EntryFormDialog } from "@/components/entries/entry-form-dialog"
import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { StatCard } from "@/components/stats/stat-card"
import { formatMoney } from "@/lib/mock-data"
import { autoBuckets, toStatPoints, trendOf } from "@/lib/stat-series"
import { useSettings } from "@/lib/use-settings"
import { useEntryData } from "@/lib/use-entry-data"
import type { Entry } from "@/lib/types"

type Timeframe = "year" | "month" | "all" | "custom"

const timeframeItems: { value: Timeframe; label: string }[] = [
  { value: "year", label: "This Year" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom range" },
]

function timeframeBounds(
  timeframe: Timeframe,
  customFrom: string,
  customTo: string,
  now = new Date()
): { from?: Date; to?: Date } {
  if (timeframe === "year") return { from: new Date(now.getFullYear(), 0, 1) }
  if (timeframe === "month")
    return { from: new Date(now.getFullYear(), now.getMonth(), 1) }
  if (timeframe === "custom") {
    return {
      from: customFrom ? new Date(`${customFrom}T00:00:00`) : undefined,
      to: customTo ? new Date(`${customTo}T23:59:59`) : undefined,
    }
  }
  return {}
}

function formatCash(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
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

export function P2PPage() {
  // Subscribing re-renders every amount when the display currency changes.
  useSettings()
  const { entries, setEntries, sources, categoryOptions, tagOptions, saveEntry } =
    useEntryData()

  const [timeframe, setTimeframe] = React.useState<Timeframe>("year")
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Entry | null>(null)

  const sourceById = React.useMemo(
    () => new Map(sources.map((s) => [s.id, s])),
    [sources]
  )

  const trades = React.useMemo(() => {
    const { from, to } = timeframeBounds(timeframe, customFrom, customTo)
    return entries
      .filter((entry) => {
        if (entry.type !== "p2p" || !entry.p2p) return false
        const when = new Date(entry.datetime)
        if (from && when < from) return false
        if (to && when > to) return false
        return true
      })
      .sort((a, b) => b.datetime.localeCompare(a.datetime))
  }, [entries, timeframe, customFrom, customTo])

  const sold = trades.filter((t) => t.p2p!.direction === "usd-to-cash")
  const bought = trades.filter((t) => t.p2p!.direction === "cash-to-usd")
  const soldUsd = sold.reduce((s, t) => s + t.amount, 0)
  const boughtUsd = bought.reduce((s, t) => s + t.amount, 0)
  const soldCash = sold.reduce((s, t) => s + t.p2p!.cashAmount, 0)
  const avgSellRate = soldUsd > 0 ? soldCash / soldUsd : 0
  const netUsd = boughtUsd - soldUsd

  // The cash currency used most in this period, for the card sub-lines.
  const currency = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of trades) {
      counts.set(t.p2p!.cashCurrency, (counts.get(t.p2p!.cashCurrency) ?? 0) + 1)
    }
    let best = "NPR"
    let bestCount = 0
    for (const [c, n] of counts) {
      if (n > bestCount) {
        best = c
        bestCount = n
      }
    }
    return best
  }, [trades])

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

  // Buckets follow the selected timeframe: months when it spans a while,
  // days when it doesn't, so a one-month view still draws a real line.
  const cardSeries = React.useMemo(() => {
    const buckets = autoBuckets(trades)
    const granularity: "month" | "day" =
      buckets.length > 1 &&
      buckets[1].date.getTime() - buckets[0].date.getTime() > 2 * 86_400_000
        ? "month"
        : "day"

    const sumWhere = (
      match: (entry: Entry) => boolean,
      pick: (entry: Entry) => number
    ) => (rows: Entry[]) =>
      rows.reduce((total, entry) => (match(entry) ? total + pick(entry) : total), 0)

    const isSold = (entry: Entry) => entry.p2p?.direction === "usd-to-cash"
    const isBought = (entry: Entry) => entry.p2p?.direction === "cash-to-usd"

    const soldSeries = toStatPoints(buckets, sumWhere(isSold, (e) => e.amount))
    const boughtSeries = toStatPoints(
      buckets,
      sumWhere(isBought, (e) => e.amount)
    )
    const netSeries = toStatPoints(buckets, (rows) =>
      rows.reduce(
        (total, entry) =>
          isBought(entry) ? total + entry.amount : total - entry.amount,
        0
      )
    )
    const countSeries = toStatPoints(buckets, (rows) => rows.length)
    // Weighted average sell rate for the bucket, not a mean of rates.
    const rateSeries = toStatPoints(buckets, (rows) => {
      const soldRows = rows.filter(isSold)
      const usd = soldRows.reduce((total, entry) => total + entry.amount, 0)
      const cash = soldRows.reduce(
        (total, entry) => total + (entry.p2p?.cashAmount ?? 0),
        0
      )
      return usd > 0 ? cash / usd : 0
    })

    return {
      granularity,
      sold: { data: soldSeries, trend: trendOf(soldSeries) },
      bought: { data: boughtSeries, trend: trendOf(boughtSeries) },
      net: { data: netSeries, trend: trendOf(netSeries) },
      count: { data: countSeries, trend: trendOf(countSeries) },
      rate: { data: rateSeries, trend: trendOf(rateSeries) },
    }
  }, [trades])

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Fiat/P2P
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Fiat &amp; P2P Exchange
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={timeframeItems}
            value={timeframe}
            onValueChange={(v) => setTimeframe(v as Timeframe)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {timeframeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {timeframe === "custom" ? (
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="USD Sold → Cash"
          data={cardSeries.sold.data}
          value={soldUsd}
          restLabel="Total"
          trend={cardSeries.sold.trend}
          color="var(--chart-3)"
          gradientId="p2p-sold"
          granularity={cardSeries.granularity}
        />
        <StatCard
          title="USD Bought ← Cash"
          data={cardSeries.bought.data}
          value={boughtUsd}
          restLabel="Total"
          trend={cardSeries.bought.trend}
          color="var(--chart-5)"
          gradientId="p2p-bought"
          granularity={cardSeries.granularity}
        />
        <StatCard
          title={`Average Rate (${currency})`}
          data={cardSeries.rate.data}
          value={avgSellRate}
          restLabel="Sell"
          trend={cardSeries.rate.trend}
          color="var(--chart-2)"
          gradientId="p2p-rate"
          granularity={cardSeries.granularity}
          formatOptions={{ maximumFractionDigits: 2, style: "decimal" }}
        />
        <StatCard
          title="Net Position"
          data={cardSeries.net.data}
          value={netUsd}
          trend={cardSeries.net.trend}
          color="var(--chart-1)"
          gradientId="p2p-net"
          granularity={cardSeries.granularity}
        />
        <StatCard
          title="Total Trades"
          data={cardSeries.count.data}
          value={trades.length}
          restLabel="Trades"
          trend={cardSeries.count.trend}
          color="var(--chart-4)"
          gradientId="p2p-trades"
          granularity={cardSeries.granularity}
          formatOptions={{ maximumFractionDigits: 0, style: "decimal" }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Trade history</h2>
        {trades.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyTitle>No Fiat/P2P trades in this period</EmptyTitle>
              <EmptyDescription>
                Add an entry with type Fiat/P2P and it will show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">USD Amount</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Cash Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((entry) => {
                  const { date, time } = formatEntryDate(entry.datetime)
                  const p2p = entry.p2p!
                  const source = entry.sourceId
                    ? sourceById.get(entry.sourceId)
                    : undefined
                  const isSold = p2p.direction === "usd-to-cash"
                  return (
                    <TableRow key={entry.id}>
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
                          {isSold ? (
                            <ArrowUpRight className="text-destructive" />
                          ) : (
                            <ArrowDownLeft className="text-success" />
                          )}
                          {isSold ? "Sold USD" : "Bought USD"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMoney(entry.amount, "USD")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p2p.rate}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCash(p2p.cashAmount, p2p.cashCurrency)}
                      </TableCell>
                      <TableCell>{source?.name ?? "—"}</TableCell>
                      <TableCell className="max-w-48">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-muted-foreground">
                            {entry.note ?? "—"}
                          </span>
                          {entry.attachments?.length ? (
                            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                              <Paperclip className="size-3" />
                              {entry.attachments.length}
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
                                aria-label="Trade options"
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
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
