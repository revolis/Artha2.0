// Report building and export. Turns filtered entries into a branded document
// in CSV, JSON, or print-ready HTML (which the browser saves as PDF).

import { entryTypeLabels } from "@/components/entries/entry-form-dialog"
import { getNetAmount } from "@/lib/mock-data"
import { SITE } from "@/lib/site"
import type { Entry, Source } from "@/lib/types"

export interface ReportTotals {
  income: number
  expense: number
  net: number
  cashIn: number
  cashOut: number
}

export interface ReportMeta {
  scopeLabel: string
  periodLabel: string
  generatedAt: Date
  entryCount: number
  totals: ReportTotals
}

export interface ReportRow {
  date: string
  time: string
  type: string
  category: string
  source: string
  tags: string
  amount: number
  netEffect: number
  direction: string
  cashCurrency: string
  rate: string
  cashAmount: string
  note: string
}

const COLUMNS: { key: keyof ReportRow; label: string; numeric?: boolean }[] = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "type", label: "Type" },
  { key: "category", label: "Category" },
  { key: "source", label: "Source" },
  { key: "tags", label: "Tags" },
  { key: "amount", label: "Amount (USD)", numeric: true },
  { key: "netEffect", label: "Net Effect (USD)", numeric: true },
  { key: "direction", label: "Direction" },
  { key: "cashCurrency", label: "Cash Currency" },
  { key: "rate", label: "Rate" },
  { key: "cashAmount", label: "Cash Amount" },
  { key: "note", label: "Note" },
]

export function buildReportRows(
  entries: Entry[],
  sources: Source[]
): ReportRow[] {
  const sourceById = new Map(sources.map((source) => [source.id, source.name]))
  return entries
    .slice()
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .map((entry) => {
      const when = new Date(entry.datetime)
      return {
        date: entry.datetime.slice(0, 10),
        time: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(when),
        type: entryTypeLabels[entry.type],
        category: entry.category ?? "",
        source: entry.sourceId ? (sourceById.get(entry.sourceId) ?? "") : "",
        tags: entry.tags.join("; "),
        amount: entry.amount,
        netEffect: getNetAmount(entry),
        direction: entry.p2p
          ? entry.p2p.direction === "usd-to-cash"
            ? "Sold USD"
            : "Bought USD"
          : "",
        cashCurrency: entry.p2p?.cashCurrency ?? "",
        rate: entry.p2p ? String(entry.p2p.rate) : "",
        cashAmount: entry.p2p ? String(entry.p2p.cashAmount) : "",
        note: entry.note ?? "",
      }
    })
}

export function getReportTotals(entries: Entry[]): ReportTotals {
  const totals: ReportTotals = {
    income: 0,
    expense: 0,
    net: 0,
    cashIn: 0,
    cashOut: 0,
  }
  for (const entry of entries) {
    if (entry.type === "profit") totals.income += entry.amount
    else if (
      entry.type === "loss" ||
      entry.type === "fee" ||
      entry.type === "tax"
    ) {
      totals.expense += entry.amount
    } else if (entry.type === "p2p") {
      if (entry.p2p?.direction === "cash-to-usd") totals.cashIn += entry.amount
      else totals.cashOut += entry.amount
    }
    totals.net += getNetAmount(entry)
  }
  return totals
}

function formatStamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date)
}

// --- CSV -------------------------------------------------------------------

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// A short metadata preamble carries the branding a CSV can't show as a logo.
// It sits above a blank line so the table below stays easy to read.
export function toCSV(meta: ReportMeta, rows: ReportRow[]): string {
  const preamble = [
    [SITE.name],
    [SITE.tagline],
    [],
    ["Report", meta.scopeLabel],
    ["Period", meta.periodLabel],
    ["Generated", formatStamp(meta.generatedAt)],
    ["Entries", String(meta.entryCount)],
    ["Total Income (USD)", meta.totals.income.toFixed(2)],
    ["Total Expense (USD)", meta.totals.expense.toFixed(2)],
    ["Net (USD)", meta.totals.net.toFixed(2)],
    ["USD Cashed Out", meta.totals.cashOut.toFixed(2)],
    ["USD Cashed In", meta.totals.cashIn.toFixed(2)],
    [],
  ]
    .map((line) => line.map(csvCell).join(","))
    .join("\n")

  const header = COLUMNS.map((column) => csvCell(column.label)).join(",")
  const body = rows
    .map((row) => COLUMNS.map((column) => csvCell(row[column.key])).join(","))
    .join("\n")

  return `${preamble}\n${header}\n${body}\n`
}

// --- JSON ------------------------------------------------------------------

export function toJSON(meta: ReportMeta, rows: ReportRow[]): string {
  return JSON.stringify(
    {
      report: {
        application: SITE.name,
        tagline: SITE.tagline,
        title: meta.scopeLabel,
        period: meta.periodLabel,
        generatedAt: meta.generatedAt.toISOString(),
        entryCount: meta.entryCount,
        currency: "USD",
        totals: meta.totals,
      },
      entries: rows,
    },
    null,
    2
  )
}

// --- Print / PDF -----------------------------------------------------------

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * The printable report. The formatter is passed in rather than imported: this
 * runs outside React, and the reader's display currency belongs to React state
 * now. Whatever the screen is showing, the print-out matches.
 */
export function buildPrintHTML(
  meta: ReportMeta,
  rows: ReportRow[],
  logoDataUrl: string | null,
  formatAmount: (amount: number) => string
): string {
  const summary = [
    ["Total Income", formatAmount(meta.totals.income)],
    ["Total Expense", formatAmount(meta.totals.expense)],
    ["Net Result", formatAmount(meta.totals.net)],
    ["Cashed Out", formatAmount(meta.totals.cashOut)],
    ["Cashed In", formatAmount(meta.totals.cashIn)],
  ]
    .map(
      ([label, value]) =>
        `<div class="stat"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-value">${escapeHtml(value)}</span></div>`
    )
    .join("")

  const head = COLUMNS.map(
    (column) =>
      `<th class="${column.numeric ? "num" : ""}">${escapeHtml(column.label)}</th>`
  ).join("")

  const body = rows
    .map((row) => {
      const cells = COLUMNS.map((column) => {
        const raw = row[column.key]
        const text = column.numeric ? formatAmount(Number(raw)) : String(raw)
        const tone =
          column.key === "netEffect"
            ? Number(raw) > 0
              ? " pos"
              : Number(raw) < 0
                ? " neg"
                : ""
            : ""
        return `<td class="${column.numeric ? "num" : ""}${tone}">${escapeHtml(text)}</td>`
      }).join("")
      return `<tr>${cells}</tr>`
    })
    .join("")

  const logo = logoDataUrl
    ? `<img class="logo" src="${logoDataUrl}" alt="" />`
    : ""

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(SITE.name)} — ${escapeHtml(meta.scopeLabel)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #18181b; margin: 0; font-size: 11px; line-height: 1.5;
  }
  header { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 2px solid #18181b; }
  .logo { width: 44px; height: 44px; object-fit: contain; }
  .brand-name { font-size: 20px; font-weight: 700; letter-spacing: 0.18em; }
  .brand-tag { font-size: 11px; color: #71717a; }
  .doc-title { margin-left: auto; text-align: right; }
  .doc-title h1 { margin: 0; font-size: 15px; font-weight: 600; }
  .doc-title p { margin: 2px 0 0; font-size: 11px; color: #71717a; }
  .meta { display: flex; flex-wrap: wrap; gap: 22px; margin: 14px 0; font-size: 11px; }
  .meta div span { color: #71717a; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .stat { border: 1px solid #e4e4e7; border-radius: 8px; padding: 8px 12px; min-width: 130px; }
  .stat-label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.09em; color: #71717a; }
  .stat-value { display: block; font-size: 14px; font-weight: 600; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; color: #52525b;
       border-bottom: 1px solid #d4d4d8; padding: 7px 6px; }
  td { padding: 6px; border-bottom: 1px solid #f4f4f5; vertical-align: top; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .num { text-align: right; white-space: nowrap; }
  .pos { color: #15803d; }
  .neg { color: #b91c1c; }
  .empty { padding: 28px; text-align: center; color: #71717a; }
  footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e4e4e7;
           display: flex; justify-content: space-between; font-size: 9px; color: #71717a; }
</style>
</head>
<body>
  <header>
    ${logo}
    <div>
      <div class="brand-name">${escapeHtml(SITE.name)}</div>
      <div class="brand-tag">${escapeHtml(SITE.tagline)}</div>
    </div>
    <div class="doc-title">
      <h1>${escapeHtml(meta.scopeLabel)}</h1>
      <p>${escapeHtml(meta.periodLabel)}</p>
    </div>
  </header>

  <div class="meta">
    <div><span>Generated:</span> ${escapeHtml(formatStamp(meta.generatedAt))}</div>
    <div><span>Entries:</span> ${meta.entryCount}</div>
    <div><span>Currency:</span> USD</div>
  </div>

  <div class="stats">${summary}</div>

  ${
    rows.length === 0
      ? `<p class="empty">No entries match this report.</p>`
      : `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
  }

  <footer>
    <span>${escapeHtml(SITE.name)} — ${escapeHtml(meta.scopeLabel)}</span>
    <span>Generated ${escapeHtml(formatStamp(meta.generatedAt))}</span>
  </footer>
</body>
</html>`
}

// --- Delivery --------------------------------------------------------------

export function downloadFile(
  filename: string,
  content: string,
  mime: string
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// Reads the logo as a data URL so it is guaranteed to be present in the
// print document rather than racing a network fetch.
export async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(SITE.logoPath)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function openPrintWindow(html: string): boolean {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return false
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  // Give the embedded logo a tick to decode before the print dialog opens.
  printWindow.setTimeout(() => printWindow.print(), 350)
  return true
}

export function reportFilename(scopeLabel: string, extension: string): string {
  const slug = scopeLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const stamp = new Date().toISOString().slice(0, 10)
  return `artha-${slug}-${stamp}.${extension}`
}
