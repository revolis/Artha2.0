"use client"

import * as React from "react"

import { AppShell } from "@/components/layout/app-shell"
import { QueryParamSync } from "@/components/layout/query-param-sync"
import { Badge } from "@/components/ui/badge"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getEntryYear } from "@/lib/mock-data"
import { useMoney } from "@/lib/use-money"
import {
  buildPrintHTML,
  buildReportRows,
  downloadFile,
  getReportTotals,
  loadLogoDataUrl,
  openPrintWindow,
  reportFilename,
  toCSV,
  toJSON,
  type ReportMeta,
} from "@/lib/reports"
import { useEntryData } from "@/lib/use-entry-data"
import type { Entry, EntryType } from "@/lib/types"
import { cn } from "@/lib/utils"

type ScopeKind =
  | "all"
  | "profit"
  | "loss"
  | "fee"
  | "tax"
  | "p2p"
  | "transfer"
  | "category"
  | "source"

const scopeItems: { value: ScopeKind; label: string }[] = [
  { value: "all", label: "All entries" },
  { value: "profit", label: "Profit only" },
  { value: "loss", label: "Loss only" },
  { value: "fee", label: "Fees only" },
  { value: "tax", label: "Tax only" },
  { value: "p2p", label: "Fiat/P2P only" },
  { value: "transfer", label: "Transfers only" },
  { value: "category", label: "By category" },
  { value: "source", label: "By source" },
]

type RangeKind = "year" | "all" | "custom"

const rangeItems: { value: RangeKind; label: string }[] = [
  { value: "year", label: "Selected year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
]

const TYPE_SCOPES: Record<string, EntryType> = {
  profit: "profit",
  loss: "loss",
  fee: "fee",
  tax: "tax",
  p2p: "p2p",
  transfer: "transfer",
}

// One-click presets that fill in the builder below.
const presets: { label: string; description: string; scope: ScopeKind }[] = [
  {
    label: "Tax Report",
    description: "Every tax entry for filing",
    scope: "tax",
  },
  {
    label: "Fiat/P2P Report",
    description: "Cash conversions with rates",
    scope: "p2p",
  },
  {
    label: "Fees & Charges",
    description: "Platform and withdrawal fees",
    scope: "fee",
  },
  {
    label: "Full Export",
    description: "Every entry, nothing filtered",
    scope: "all",
  },
]

export function ReportsPage() {
  const { formatMoney } = useMoney()
  const { entries, sources } = useEntryData()
  const currentYear = new Date().getFullYear()

  // Deep link support, e.g. /reports?year=2026&scope=all — used by the
  // "export before deleting" prompt on the dashboard. The params arrive from
  // the QueryParamSync leaves below rather than being read here, so that
  // reading them cannot hold up the rest of the page.
  const [year, setYear] = React.useState(currentYear)
  const [scope, setScope] = React.useState<ScopeKind>("all")

  const applyLinkedYear = React.useCallback((value: string) => {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) setYear(parsed)
  }, [])

  const applyLinkedScope = React.useCallback((value: string) => {
    if (scopeItems.some((item) => item.value === value)) {
      setScope(value as ScopeKind)
    }
  }, [])
  const [scopeValue, setScopeValue] = React.useState<string>("")
  const [range, setRange] = React.useState<RangeKind>("year")
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")
  const [notice, setNotice] = React.useState<string | null>(null)

  const yearItems = React.useMemo(() => {
    const years = new Set(entries.map(getEntryYear))
    years.add(currentYear)
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((value) => ({ value: String(value), label: String(value) }))
  }, [entries, currentYear])

  const sourceById = React.useMemo(
    () => new Map(sources.map((source) => [source.id, source.name])),
    [sources]
  )

  const categoryItems = React.useMemo(() => {
    const names = Array.from(
      new Set(
        entries.map((entry) => entry.category).filter(Boolean) as string[]
      )
    ).sort()
    return [
      { value: "", label: "All categories (grouped)" },
      ...names.map((name) => ({ value: name, label: name })),
    ]
  }, [entries])

  const sourceItems = React.useMemo(
    () => [
      { value: "", label: "All sources (grouped)" },
      ...sources.map((source) => ({
        value: source.id,
        label: source.name,
      })),
    ],
    [sources]
  )

  const filtered = React.useMemo(() => {
    return entries.filter((entry: Entry) => {
      if (range === "year" && getEntryYear(entry) !== year) return false
      if (range === "custom") {
        const day = entry.datetime.slice(0, 10)
        if (customFrom && day < customFrom) return false
        if (customTo && day > customTo) return false
      }
      if (scope in TYPE_SCOPES && entry.type !== TYPE_SCOPES[scope])
        return false
      if (scope === "category" && scopeValue && entry.category !== scopeValue) {
        return false
      }
      if (scope === "source" && scopeValue && entry.sourceId !== scopeValue) {
        return false
      }
      return true
    })
  }, [entries, range, year, customFrom, customTo, scope, scopeValue])

  const totals = React.useMemo(() => getReportTotals(filtered), [filtered])
  const rows = React.useMemo(
    () => buildReportRows(filtered, sources),
    [filtered, sources]
  )

  const scopeLabel = React.useMemo(() => {
    const base =
      scopeItems.find((item) => item.value === scope)?.label ?? "Report"
    if (scope === "category" && scopeValue) return `Category — ${scopeValue}`
    if (scope === "source" && scopeValue) {
      return `Source — ${sourceById.get(scopeValue) ?? scopeValue}`
    }
    return base
  }, [scope, scopeValue, sourceById])

  const periodLabel = React.useMemo(() => {
    if (range === "all") return "All time"
    if (range === "year") return `Year ${year}`
    if (customFrom || customTo) {
      return `${customFrom || "start"} to ${customTo || "today"}`
    }
    return "Custom range"
  }, [range, year, customFrom, customTo])

  function buildMeta(): ReportMeta {
    return {
      scopeLabel,
      periodLabel,
      generatedAt: new Date(),
      entryCount: filtered.length,
      totals,
    }
  }

  function exportCSV() {
    downloadFile(
      reportFilename(scopeLabel, "csv"),
      toCSV(buildMeta(), rows),
      "text/csv"
    )
    setNotice(`CSV downloaded — ${filtered.length} entries.`)
  }

  function exportJSON() {
    downloadFile(
      reportFilename(scopeLabel, "json"),
      toJSON(buildMeta(), rows),
      "application/json"
    )
    setNotice(`JSON downloaded — ${filtered.length} entries.`)
  }

  async function exportPDF() {
    const logo = await loadLogoDataUrl()
    // The print-out is formatted for whoever is looking at the screen, so the
    // PDF and the page agree. The CSV stays in USD, labelled as such.
    const opened = openPrintWindow(
      buildPrintHTML(buildMeta(), rows, logo, (amount) =>
        formatMoney(amount, "USD")
      )
    )
    setNotice(
      opened
        ? "Report opened in a new tab — choose “Save as PDF” in the print dialog."
        : "Your browser blocked the popup. Allow popups for this site, then try again."
    )
  }

  function applyPreset(next: ScopeKind) {
    setScope(next)
    setScopeValue("")
    setNotice(null)
  }

  const preview = rows.slice(0, 8)

  return (
    <AppShell>
      {/* Both render nothing, and sit in their own boundary so reading the
          deep-link params cannot stop the page hydrating. */}
      <React.Suspense fallback={null}>
        <QueryParamSync name="year" onChange={applyLinkedYear} />
        <QueryParamSync name="scope" onChange={applyLinkedScope} />
      </React.Suspense>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Reports
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reports &amp; Exports
          </h1>
        </div>
        <Select
          items={yearItems}
          value={String(year)}
          onValueChange={(value) => setYear(Number(value))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {yearItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick reports</CardTitle>
          <CardDescription>
            Start from a common report, then adjust it below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.scope)}
              className={cn(
                "flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors hover:bg-muted",
                scope === preset.scope && "border-ring bg-muted"
              )}
            >
              <span className="font-medium">{preset.label}</span>
              <span className="text-xs text-muted-foreground">
                {preset.description}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build a report</CardTitle>
          <CardDescription>
            Every export carries the {`ARTHA`} logo, name, period and totals.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="report-scope">Report type</FieldLabel>
                <Select
                  items={scopeItems}
                  value={scope}
                  onValueChange={(value) => {
                    setScope(value as ScopeKind)
                    setScopeValue("")
                  }}
                >
                  <SelectTrigger id="report-scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {scopeItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {scope === "category" ? (
                <Field>
                  <FieldLabel htmlFor="report-category">Category</FieldLabel>
                  <Select
                    items={categoryItems}
                    value={scopeValue}
                    onValueChange={(value) => setScopeValue(value as string)}
                  >
                    <SelectTrigger id="report-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categoryItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              {scope === "source" ? (
                <Field>
                  <FieldLabel htmlFor="report-source">Source</FieldLabel>
                  <Select
                    items={sourceItems}
                    value={scopeValue}
                    onValueChange={(value) => setScopeValue(value as string)}
                  >
                    <SelectTrigger id="report-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {sourceItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="report-range">Period</FieldLabel>
                <Select
                  items={rangeItems}
                  value={range}
                  onValueChange={(value) => setRange(value as RangeKind)}
                >
                  <SelectTrigger id="report-range">
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
              </Field>

              {range === "custom" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="report-from">From</FieldLabel>
                    <Input
                      id="report-from"
                      type="date"
                      value={customFrom}
                      onChange={(event) => setCustomFrom(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="report-to">To</FieldLabel>
                    <Input
                      id="report-to"
                      type="date"
                      value={customTo}
                      onChange={(event) => setCustomTo(event.target.value)}
                    />
                  </Field>
                </>
              ) : null}
            </div>
          </FieldGroup>

          <Separator />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="font-medium">{scopeLabel}</span>
            <Badge variant="secondary">{periodLabel}</Badge>
            <span className="text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </span>
            <span className="text-muted-foreground">
              Income {formatMoney(totals.income, "USD")}
            </span>
            <span className="text-muted-foreground">
              Expense {formatMoney(totals.expense, "USD")}
            </span>
            <span
              className={cn(
                "font-medium tabular-nums",
                totals.net > 0 && "text-success",
                totals.net < 0 && "text-destructive"
              )}
            >
              Net {formatMoney(totals.net, "USD")}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <InteractiveHoverButton
              onClick={exportPDF}
              disabled={filtered.length === 0}
            >
              Download PDF
            </InteractiveHoverButton>
            <InteractiveHoverButton
              onClick={exportCSV}
              disabled={filtered.length === 0}
            >
              Download CSV
            </InteractiveHoverButton>
            <InteractiveHoverButton
              onClick={exportJSON}
              disabled={filtered.length === 0}
            >
              Download JSON
            </InteractiveHoverButton>
          </div>

          {notice ? (
            <p className="text-sm text-muted-foreground">{notice}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            {filtered.length === 0
              ? "Nothing matches this report yet."
              : `First ${Math.min(preview.length, filtered.length)} of ${filtered.length} entries that will be exported.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preview.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Adjust the report type or period to include some entries.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Net effect</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, index) => (
                    <TableRow key={`${row.date}-${index}`}>
                      <TableCell className="whitespace-nowrap">
                        {row.date}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.type}</Badge>
                      </TableCell>
                      <TableCell>{row.category || "—"}</TableCell>
                      <TableCell>{row.source || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.amount, "USD")}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          row.netEffect > 0 && "text-success",
                          row.netEffect < 0 && "text-destructive"
                        )}
                      >
                        {row.netEffect === 0
                          ? "—"
                          : formatMoney(row.netEffect, "USD")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
