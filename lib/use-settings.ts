"use client"

// App settings for the design phase: seeded from mock data, persisted in
// localStorage, and shared across every page that reads them.

import * as React from "react"

import { mockSettings } from "@/lib/mock-data"
import type { AppSettings, Currency, NotificationKey } from "@/lib/types"

const STORAGE_KEY = "artha.settings"

let cache: AppSettings | null = null
const listeners = new Set<() => void>()

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      // Merge over the seed so settings saved before a field existed still work.
      return {
        ...mockSettings,
        ...parsed,
        notifications: {
          ...mockSettings.notifications,
          ...(parsed.notifications ?? {}),
        },
      }
    }
  } catch {
    // corrupted or unavailable storage — fall back to the seed
  }
  return mockSettings
}

function getSnapshot(): AppSettings {
  if (cache === null) cache = load()
  return cache
}

function getServerSnapshot(): AppSettings {
  return mockSettings
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function write(next: AppSettings) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage full or blocked — the change still applies for this session
  }
  for (const listener of listeners) listener()
}

export function updateSettings(patch: Partial<AppSettings>) {
  write({ ...getSnapshot(), ...patch })
}

export function setNotification(
  key: NotificationKey,
  channel: "inApp" | "email",
  value: boolean
) {
  const current = getSnapshot()
  write({
    ...current,
    notifications: {
      ...current.notifications,
      [key]: { ...current.notifications[key], [channel]: value },
    },
  })
}

export function useSettings() {
  const settings = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return { settings, updateSettings, setNotification }
}

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "NPR", label: "NPR — Nepalese Rupee" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
]

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ne", label: "नेपाली (Nepali)" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
]

export const TIMEZONE_OPTIONS = [
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
]

export const NOTIFICATION_ITEMS: {
  key: NotificationKey
  title: string
  description: string
}[] = [
  {
    key: "goalMilestones",
    title: "Goal milestones",
    description: "When a goal hits 50%, 100%, or its deadline passes.",
  },
  {
    key: "weeklySummary",
    title: "Weekly summary",
    description: "A short recap of the week's entries every Monday.",
  },
  {
    key: "monthlyReport",
    title: "Monthly report",
    description: "Your full month in review, with net P/L and top sources.",
  },
  {
    key: "largeEntries",
    title: "Large entries",
    description: "When a single entry is unusually big for you.",
  },
  {
    key: "rateSync",
    title: "Exchange rate updates",
    description: "When the daily USD to NPR rate refreshes.",
  },
  {
    key: "productNews",
    title: "Product news",
    description: "New Artha features and improvements. No marketing.",
  },
]
