"use client"

// Notifications for the design phase. Nothing is pushed from a server — the
// list is derived from the data already on the device (goals, entries,
// settings) and filtered by the user's in-app notification preferences.
// Which ones have been read is remembered in localStorage.

import * as React from "react"

import { formatMoney } from "@/lib/mock-data"
import type { AppSettings, Entry, Goal, NotificationKey } from "@/lib/types"

export type NotificationKind = "goal" | "entry" | "report" | "rate"

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

/** Which preference switch decides whether a kind of notification shows. */
const KIND_PREFS: Record<NotificationKind, NotificationKey> = {
  goal: "goalMilestones",
  entry: "largeEntries",
  report: "monthlyReport",
  rate: "rateSync",
}

function buildNotifications(
  goals: Goal[],
  entries: Entry[],
  settings: AppSettings,
  rateUpdatedAt: string,
  now: Date
): AppNotification[] {
  const items: AppNotification[] = []
  const today = now.toISOString().slice(0, 10)

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

  // The three biggest profits of the last 90 days are worth a mention.
  const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
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

  // Last month's report, available from the 1st of this month.
  const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  items.push({
    id: `report-${lastMonth.toISOString().slice(0, 7)}`,
    kind: "report",
    title: "Monthly report ready",
    body: `Your ${new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("en-US", { month: "long" })} summary is ready to export.`,
    datetime: lastMonth.toISOString().slice(0, 10),
    href: "/reports",
  })

  items.push({
    id: `rate-${rateUpdatedAt}`,
    kind: "rate",
    title: "Exchange rates updated",
    body: `Rates were last recorded on ${rateUpdatedAt}.`,
    datetime: rateUpdatedAt,
    href: "/settings",
  })

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

export function useNotifications(
  goals: Goal[],
  entries: Entry[],
  settings: AppSettings,
  rateUpdatedAt: string
) {
  const read = React.useSyncExternalStore(
    subscribe,
    getReadSnapshot,
    getServerReadSnapshot
  )

  // A stable "now" per render pass keeps the derived list from churning.
  const notifications = React.useMemo(
    () =>
      buildNotifications(goals, entries, settings, rateUpdatedAt, new Date()),
    [goals, entries, settings, rateUpdatedAt]
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

  return { notifications, readSet, unreadCount, markAllRead, markRead }
}
