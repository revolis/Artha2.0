"use client"

// Notifications for the design phase. Nothing is pushed from a server — the
// list is derived from the data already on the device (goals, entries, rates)
// and filtered by the user's in-app notification preferences. Which ones have
// been read is remembered in localStorage.

import * as React from "react"

import { getNetAmount } from "@/lib/mock-data"
import type {
  AppSettings,
  Currency,
  Entry,
  Goal,
  NotificationKey,
} from "@/lib/types"
import { useMoney } from "@/lib/use-money"

export type NotificationKind =
  "goal" | "entry" | "report" | "rate" | "summary" | "news"

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  /** ISO date (or date + time) the notification is about. */
  datetime: string
  href: string
}

const STORAGE_KEY = "artha.notifications.read"

let readCache: string[] | null = null
const listeners = new Set<() => void>()
const EMPTY: string[] = []

function loadRead(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    // corrupted or unavailable storage — treat everything as unread
  }
  return EMPTY
}

function getReadSnapshot(): string[] {
  if (readCache === null) readCache = loadRead()
  return readCache
}

function getServerReadSnapshot(): string[] {
  return EMPTY
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function writeRead(next: string[]) {
  readCache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage full or blocked — the change still applies for this session
  }
  for (const listener of listeners) listener()
}

/**
 * Which preference switch decides whether a kind of notification shows.
 * Every key in Settings → Notifications appears here — if one didn't, its
 * switch would silently do nothing.
 */
const KIND_PREFS: Record<NotificationKind, NotificationKey> = {
  goal: "goalMilestones",
  entry: "largeEntries",
  report: "monthlyReport",
  rate: "rateSync",
  summary: "weeklySummary",
  news: "productNews",
}

/** What's new in Artha. Fixed dates so the list doesn't shuffle about. */
const PRODUCT_NEWS: {
  id: string
  date: string
  title: string
  body: string
}[] = [
  {
    id: "news-live-rates",
    date: "2026-08-06",
    title: "Live exchange rates",
    body: "The Fiat Currency card now pulls today's market rates and applies them across the site.",
  },
  {
    id: "news-goal-gauge",
    date: "2026-08-04",
    title: "Goals got a new look",
    body: "Each goal now shows completed, remaining and anything past target on one arc.",
  },
]

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function buildNotifications(
  goals: Goal[],
  entries: Entry[],
  settings: AppSettings,
  rate: { updatedAt: string; isLive: boolean },
  now: Date,
  // Passed in rather than imported: amounts are formatted for the reader, and
  // that depends on settings this module has no business reaching for.
  formatMoney: (amount: number, from?: Currency) => string
): AppNotification[] {
  const items: AppNotification[] = []
  const today = isoDay(now)

  // ---- Goals -------------------------------------------------------------
  for (const goal of goals) {
    if (goal.completedAt) {
      items.push({
        id: `goal-done-${goal.id}`,
        kind: "goal",
        title: "Goal reached",
        body: `${goal.title} hit its ${formatMoney(goal.targetAmount, goal.currency)} target.`,
        datetime: goal.completedAt,
        href: "/goals",
      })
      continue
    }

    const percent =
      goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0

    if (goal.endDate && goal.endDate < today) {
      items.push({
        id: `goal-late-${goal.id}`,
        kind: "goal",
        title: "Goal timeframe ended",
        body: `${goal.title} finished at ${Math.round(percent)}% of its target.`,
        datetime: goal.endDate,
        href: "/goals",
      })
    } else if (percent >= 50) {
      items.push({
        id: `goal-half-${goal.id}`,
        kind: "goal",
        title: "Halfway there",
        body: `${goal.title} is ${Math.round(percent)}% of the way to its target.`,
        datetime: goal.startDate ?? today,
        href: "/goals",
      })
    }
  }

  // ---- Large entries -----------------------------------------------------
  const cutoff = isoDay(new Date(now.getTime() - 90 * 86_400_000))
  const bigWins = entries
    .filter((entry) => entry.type === "profit" && entry.datetime >= cutoff)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  for (const entry of bigWins) {
    items.push({
      id: `entry-${entry.id}`,
      kind: "entry",
      title: "Large entry recorded",
      body: `${formatMoney(entry.amount, "USD")} from ${entry.category ?? "an entry"}.`,
      datetime: entry.datetime,
      href: "/entries",
    })
  }

  // ---- Weekly summary ----------------------------------------------------
  const weekStart = isoDay(new Date(now.getTime() - 7 * 86_400_000))
  const weekEntries = entries.filter((entry) => entry.datetime >= weekStart)
  const weekNet = weekEntries.reduce(
    (sum, entry) => sum + getNetAmount(entry),
    0
  )
  items.push({
    id: `summary-${weekStart}`,
    kind: "summary",
    title: "Your week in review",
    body:
      weekEntries.length === 0
        ? "No entries logged in the last seven days."
        : `${weekEntries.length} ${weekEntries.length === 1 ? "entry" : "entries"}, ${weekNet >= 0 ? "up" : "down"} ${formatMoney(Math.abs(weekNet), "USD")} on the week.`,
    datetime: today,
    href: "/analytics",
  })

  // ---- Monthly report ----------------------------------------------------
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  items.push({
    id: `report-${isoDay(monthStart).slice(0, 7)}`,
    kind: "report",
    title: "Monthly report ready",
    body: `Your ${new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("en-US", { month: "long" })} summary is ready to export.`,
    datetime: isoDay(monthStart),
    href: "/reports",
  })

  // ---- Exchange rates ----------------------------------------------------
  items.push({
    id: `rate-${rate.updatedAt}-${rate.isLive ? "live" : "seed"}`,
    kind: "rate",
    title: rate.isLive ? "Exchange rates updated" : "Rates not updated yet",
    body: rate.isLive
      ? `Market rates last fetched for ${rate.updatedAt}.`
      : "Still using the built-in rates — press Update on the Fiat Currency card.",
    datetime: rate.updatedAt,
    href: "/settings",
  })

  // ---- Product news ------------------------------------------------------
  for (const news of PRODUCT_NEWS) {
    items.push({
      id: news.id,
      kind: "news",
      title: news.title,
      body: news.body,
      datetime: news.date,
      href: "/about",
    })
  }

  return items
    .filter((item) => settings.notifications[KIND_PREFS[item.kind]].inApp)
    .sort((a, b) => (a.datetime < b.datetime ? 1 : -1))
}

/** "2h ago", "3 days ago", "12 Mar" — short and readable. */
export function timeAgo(datetime: string, now = new Date()): string {
  const then = new Date(datetime).getTime()
  if (Number.isNaN(then)) return ""
  const minutes = Math.round((now.getTime() - then) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  return new Date(datetime).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}

/** Which bucket a notification falls into, for the panel's section headings. */
export function bucketOf(datetime: string, now = new Date()): string {
  const then = new Date(datetime).getTime()
  if (Number.isNaN(then)) return "Earlier"
  const days = (now.getTime() - then) / 86_400_000
  if (days < 1) return "Today"
  if (days < 7) return "This week"
  if (days < 30) return "This month"
  return "Earlier"
}

export function useNotifications(
  goals: Goal[],
  entries: Entry[],
  settings: AppSettings,
  rateUpdatedAt: string,
  rateIsLive: boolean
) {
  const read = React.useSyncExternalStore(
    subscribe,
    getReadSnapshot,
    getServerReadSnapshot
  )
  const { formatMoney } = useMoney()

  const notifications = React.useMemo(
    () =>
      buildNotifications(
        goals,
        entries,
        settings,
        { updatedAt: rateUpdatedAt, isLive: rateIsLive },
        new Date(),
        formatMoney
      ),
    [goals, entries, settings, rateUpdatedAt, rateIsLive, formatMoney]
  )

  const readSet = React.useMemo(() => new Set(read), [read])
  const unreadCount = notifications.filter(
    (item) => !readSet.has(item.id)
  ).length

  const markAllRead = React.useCallback(() => {
    writeRead(notifications.map((item) => item.id))
  }, [notifications])

  const markRead = React.useCallback((id: string) => {
    const current = getReadSnapshot()
    if (current.includes(id)) return
    writeRead([...current, id])
  }, [])

  const markUnread = React.useCallback((id: string) => {
    writeRead(getReadSnapshot().filter((item) => item !== id))
  }, [])

  return {
    notifications,
    readSet,
    unreadCount,
    markAllRead,
    markRead,
    markUnread,
  }
}
