// Sends the weekly summary and the monthly statement.
//
// Called on a schedule by pg_cron, not by anyone using the site. The database
// works out who wants one and what it says (notification_digest); this turns
// each row into an email.
//
// The monthly one is meant to be read in about fifteen seconds: the number
// that matters is large and near the top, everything under it explains that
// number, and nothing needs a second pass. Laid out with tables and inline
// styles because that is what mail clients actually render — flexbox, grid and
// <style> blocks are unreliable across Outlook and Gmail.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SITE = "https://0xr8n.me"
const LOGO = `${SITE}/logo.png`

interface Counts {
  profit: number
  loss: number
  fee: number
  tax: number
  transfer: number
  p2p: number
  cashout: number
}

interface Goal {
  title: string
  /** Target in USD, whatever currency it was set in. */
  targetUsd: number
  /** Everything counted toward it so far. */
  achievedUsd: number
  /** What this period alone contributed. */
  monthUsd: number
  /** achievedUsd as a share of target. */
  percent: number
  /** monthUsd as a share of target. */
  monthPercent: number
}

interface Detail {
  counts?: Counts
  cashedOut?: number
  topIncome?: { category: string; amount: number; shareOfIncome: number }
  topLoss?: { category: string; amount: number; shareOfOutgoings: number }
  monthlyGoal?: Goal
  yearlyGoal?: Goal
}

interface DigestRow {
  user_id: string
  email: string
  display_name: string | null
  entry_count: number
  net: number
  income: number
  outgoings: number
  period_start: string
  period_end: string
  detail: Detail | null
}

const INK = "#111827"
const MUTED = "#6b7280"
const LINE = "#e5e7eb"
const PAGE = "#f4f5f7"
const UP = "#047857"
const DOWN = "#b91c1c"

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

function monthName(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  })
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * A progress bar in up to three parts: what was already there, what this
 * period added, and what is left to go.
 *
 * The middle segment is the point of the whole thing — it shows the month's
 * contribution as a piece of the bar rather than as a number to be taken on
 * trust. Table cells with percentage widths, which is the one layout every
 * mail client draws correctly.
 */
function bar(priorPercent: number, addedPercent: number): string {
  const prior = Math.max(0, Math.min(100, Math.round(priorPercent)))
  const added = Math.max(0, Math.min(100 - prior, Math.round(addedPercent)))
  const rest = 100 - prior - added

  const segments = [
    { width: prior, colour: INK },
    { width: added, colour: UP },
    { width: rest, colour: LINE },
  ].filter((segment) => segment.width > 0)

  const cells = segments
    .map((segment, index) => {
      const first = index === 0
      const last = index === segments.length - 1
      const radius = `${first ? "5px" : "0"} ${last ? "5px" : "0"} ${last ? "5px" : "0"} ${first ? "5px" : "0"}`
      return `<td width="${segment.width}%" style="height:10px;background:${segment.colour};border-radius:${radius};font-size:0;line-height:0">&nbsp;</td>`
    })
    .join("")

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;table-layout:fixed"><tr>${cells}</tr></table>`
}

function shell(title: string, inner: string, footerNote: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${PAGE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(title)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PAGE};padding:24px 12px">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">

<tr><td style="padding:0 0 18px 0">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="padding-right:10px"><img src="${LOGO}" width="28" height="28" alt="" style="display:block;border:0;border-radius:6px"></td>
    <td style="font-size:15px;font-weight:700;letter-spacing:.18em;color:${INK}">ARTHA</td>
  </tr></table>
</td></tr>

<tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:16px;padding:28px 26px">
${inner}
</td></tr>

<tr><td style="padding:18px 4px 0 4px;color:${MUTED};font-size:12px;line-height:1.6">
  ${footerNote}
  <br>Change what reaches you in <a href="${SITE}/settings" style="color:${MUTED}">Settings &rsaquo; Notifications</a>.
</td></tr>

</table>
</td></tr></table>
</body></html>`
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="background:${INK};border-radius:999px">
  <a href="${href}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600">${label}</a>
</td></tr></table>`
}

/** "6 profits, 1 loss, 1 cash-out" — only the kinds that actually occurred. */
function describeMix(c: Counts): string {
  const parts: string[] = []
  const add = (n: number, one: string, many: string) => {
    if (n > 0) parts.push(`<strong>${n}</strong> ${n === 1 ? one : many}`)
  }
  add(c.profit, "profit", "profits")
  add(c.loss, "loss", "losses")
  add(c.fee, "fee", "fees")
  add(c.tax, "tax payment", "tax payments")
  add(c.transfer, "transfer", "transfers")
  add(c.cashout, "cash-out", "cash-outs")
  const bought = c.p2p - c.cashout
  add(bought, "cash purchase", "cash purchases")
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
}

function monthlyEmail(row: DigestRow) {
  const month = monthName(row.period_start)
  const d = row.detail ?? {}
  const up = row.net >= 0
  const greeting = row.display_name?.trim()
    ? `${esc(row.display_name.trim().split(/\s+/)[0])},`
    : "Hello,"

  // Three figures side by side. The net one is the headline above; these are
  // what it was made of.
  const figures = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:22px 0 4px 0">
<tr>
  <td width="33%" style="padding:12px 8px;background:${PAGE};border-radius:10px" align="center">
    <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Gross in</div>
    <div style="font-size:17px;font-weight:700;color:${INK};padding-top:4px">${money(row.income)}</div>
  </td>
  <td width="8">&nbsp;</td>
  <td width="33%" style="padding:12px 8px;background:${PAGE};border-radius:10px" align="center">
    <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Out</div>
    <div style="font-size:17px;font-weight:700;color:${INK};padding-top:4px">${money(row.outgoings)}</div>
  </td>
  <td width="8">&nbsp;</td>
  <td width="33%" style="padding:12px 8px;background:${PAGE};border-radius:10px" align="center">
    <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Net</div>
    <div style="font-size:17px;font-weight:700;color:${up ? UP : DOWN};padding-top:4px">${money(row.net)}</div>
  </td>
</tr></table>`

  // What carried the month. When one category both earned and cost the most,
  // say so plainly — that is the single most useful sentence in the email.
  let story = ""
  const ti = d.topIncome
  const tl = d.topLoss
  if (ti && tl && ti.category === tl.category) {
    story = `<p style="margin:0;font-size:15px;line-height:1.65;color:${INK}">
      <strong>${esc(ti.category)}</strong> ran both ways this month. It brought in
      <strong style="color:${UP}">${money(ti.amount)}</strong> — ${ti.shareOfIncome}% of everything you earned —
      and also cost you <strong style="color:${DOWN}">${money(tl.amount)}</strong>, the largest single drain.
      Worth a closer look before next month.</p>`
  } else if (ti) {
    story = `<p style="margin:0;font-size:15px;line-height:1.65;color:${INK}">
      <strong>${esc(ti.category)}</strong> led the month with
      <strong style="color:${UP}">${money(ti.amount)}</strong>, ${ti.shareOfIncome}% of everything you earned.${
        tl
          ? ` The biggest drain was <strong>${esc(tl.category)}</strong> at <strong style="color:${DOWN}">${money(tl.amount)}</strong>.`
          : ""
      }</p>`
  } else if (tl) {
    story = `<p style="margin:0;font-size:15px;line-height:1.65;color:${INK}">
      Nothing came in, and <strong>${esc(tl.category)}</strong> took the most out at
      <strong style="color:${DOWN}">${money(tl.amount)}</strong>.</p>`
  }

  const storyBlock = story
    ? `<div style="margin:24px 0 0 0;padding:16px 18px;background:${PAGE};border-radius:12px">${story}</div>`
    : ""

  const goalRow = (g: Goal, label: string) => {
    const total = Math.round(g.percent)
    const added = Math.round(g.monthPercent)
    const before = Math.max(0, total - added)
    const done = total >= 100

    // What the month did to this goal. When the goal only started this period
    // there is no "from" to speak of, so it just states the share.
    const movement =
      g.monthUsd > 0
        ? before > 0
          ? `${month} added <strong style="color:${UP}">${money(g.monthUsd)}</strong> &mdash; ${added}% of the target &mdash; taking this goal from ${before}% to <strong>${total}%</strong>.`
          : `${month} added <strong style="color:${UP}">${money(g.monthUsd)}</strong>, ${added}% of the target.`
        : `Nothing counted toward this goal in ${month}.`

    return `<tr><td style="padding:16px 0 0 0">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="font-size:14px;color:${INK}"><strong>${esc(g.title)}</strong>
          <span style="color:${MUTED}">&middot; ${label}</span></td>
        <td align="right" style="font-size:14px;font-weight:700;color:${done ? UP : INK}">${total}%</td>
      </tr></table>

      <div style="padding-top:7px">${bar(before, added)}</div>

      <div style="padding-top:7px;font-size:13px;color:${MUTED}">
        <strong style="color:${INK}">${money(g.achievedUsd)}</strong> of ${money(g.targetUsd)}
      </div>
      <div style="padding-top:4px;font-size:13px;line-height:1.6;color:${MUTED}">${movement}</div>
    </td></tr>`
  }

  const goals =
    d.monthlyGoal || d.yearlyGoal
      ? `<div style="margin:26px 0 0 0;padding-top:18px;border-top:1px solid ${LINE}">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${MUTED}">Goals</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${d.monthlyGoal ? goalRow(d.monthlyGoal, "this month") : ""}
            ${d.yearlyGoal ? goalRow(d.yearlyGoal, "this year") : ""}
          </table>
          <div style="padding-top:12px;font-size:11px;color:${MUTED}">
            <span style="color:${UP}">&#9632;</span> added in ${month}
          </div>
        </div>`
      : ""

  const mix = d.counts ? describeMix(d.counts) : ""
  const mixBlock = mix
    ? `<div style="margin:26px 0 0 0;padding-top:18px;border-top:1px solid ${LINE}">
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${MUTED};padding-bottom:6px">What you recorded</div>
        <p style="margin:0;font-size:14px;line-height:1.7;color:${INK}">
          <strong>${row.entry_count}</strong> ${row.entry_count === 1 ? "entry" : "entries"} — ${mix}.${
            d.cashedOut && d.cashedOut > 0
              ? ` You moved <strong>${money(d.cashedOut)}</strong> out to cash.`
              : ""
          }</p>
      </div>`
    : ""

  const inner = `
<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED}">Monthly statement</div>
<h1 style="margin:6px 0 2px 0;font-size:24px;line-height:1.25;color:${INK};font-weight:700">Your ${month} is in.</h1>
<div style="font-size:13px;color:${MUTED}">${longDate(row.period_start)} &ndash; ${longDate(row.period_end)}</div>

<p style="margin:20px 0 0 0;font-size:15px;color:${INK}">${greeting}</p>

<div style="margin:14px 0 0 0">
  <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Net for the month</div>
  <div style="font-size:38px;line-height:1.15;font-weight:800;color:${up ? UP : DOWN};padding-top:2px">${money(row.net)}</div>
</div>

${figures}
${storyBlock}
${goals}
${mixBlock}

<div style="margin:28px 0 0 0">${button("Open the full month", `${SITE}/reports`)}</div>
`

  return {
    subject: `${month}: ${up ? "+" : ""}${money(row.net)} net · your Artha statement`,
    html: shell(`Your ${month} statement`, inner, "You asked for the monthly report."),
  }
}

function weeklyEmail(row: DigestRow) {
  const up = row.net >= 0
  const greeting = row.display_name?.trim()
    ? `${esc(row.display_name.trim().split(/\s+/)[0])},`
    : "Hello,"
  const d = row.detail ?? {}
  const mix = d.counts ? describeMix(d.counts) : ""

  const inner = `
<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED}">Weekly summary</div>
<h1 style="margin:6px 0 2px 0;font-size:22px;line-height:1.3;color:${INK};font-weight:700">Your week in Artha</h1>
<div style="font-size:13px;color:${MUTED}">${longDate(row.period_start)} &ndash; ${longDate(row.period_end)}</div>

<p style="margin:18px 0 0 0;font-size:15px;color:${INK}">${greeting}</p>

<div style="margin:12px 0 0 0">
  <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Net this week</div>
  <div style="font-size:30px;line-height:1.2;font-weight:800;color:${up ? UP : DOWN};padding-top:2px">${money(row.net)}</div>
</div>

<p style="margin:16px 0 0 0;font-size:14px;line-height:1.7;color:${INK}">
  <strong>${row.entry_count}</strong> ${row.entry_count === 1 ? "entry" : "entries"}${mix ? ` — ${mix}` : ""}.
  ${money(row.income)} in, ${money(row.outgoings)} out.
</p>

<div style="margin:22px 0 0 0">${button("Open Artha", `${SITE}/dashboard`)}</div>
`

  return {
    subject: `Your week: ${up ? "+" : ""}${money(row.net)}`,
    html: shell("Your week in Artha", inner, "You asked for the weekly summary."),
  }
}

Deno.serve(async (req) => {
  const kindParam = new URL(req.url).searchParams.get("kind")
  const body = await req.json().catch(() => ({}))
  const kind = (kindParam ?? body?.kind ?? "weekly") as "weekly" | "monthly"
  // Renders and returns one email without sending anything, for checking how
  // it looks before it goes to real inboxes.
  const preview = Boolean(body?.preview)

  if (kind !== "weekly" && kind !== "monthly") {
    return json({ error: "kind must be weekly or monthly" }, 400)
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data, error } = await admin.rpc("notification_digest", { kind })
  if (error) return json({ error: error.message }, 500)

  const rows = (data ?? []) as DigestRow[]
  const build = kind === "monthly" ? monthlyEmail : weeklyEmail

  if (preview) {
    if (rows.length === 0) return json({ preview: true, recipients: 0 })
    const { subject, html } = build(rows[0])
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Subject": subject },
    })
  }

  const resendKey = Deno.env.get("RESEND_API_KEY")
  if (!resendKey) {
    return json({ kind, recipients: rows.length, sent: 0, reason: "RESEND_API_KEY not set" })
  }

  const from = Deno.env.get("MESSAGES_FROM") ?? "Artha <noreply@0xr8n.me>"
  let sent = 0
  const failures: string[] = []

  for (const row of rows) {
    const { subject, html } = build(row)
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [row.email], subject, html }),
      })
      if (res.ok) sent += 1
      else failures.push(`${row.email}: ${await res.text()}`)
    } catch (cause) {
      failures.push(`${row.email}: ${String(cause)}`)
    }
  }

  return json({ kind, recipients: rows.length, sent, failures })
})
