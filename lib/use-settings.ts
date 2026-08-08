"use client"

// App settings, from the database. One row per user, created alongside the
// account by the on_auth_user_created trigger, so it always exists by the time
// anything reads it.
//
// The hook keeps the shape the localStorage version had. What changed is that
// the first snapshot is the defaults and the stored row arrives a moment later
// — which is also what fixes the tearing the audit found, because the update
// now comes through React rather than a module variable nobody re-read.

import * as React from "react"

import { settingsFromRow, settingsToRow } from "@/lib/data/mappers"
import { mockSettings } from "@/lib/mock-data"
import { createClient } from "@/lib/supabase/client"
import type { AppSettings, Currency, NotificationKey } from "@/lib/types"

let cache: AppSettings = mockSettings
let loaded = false
let inFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function publish() {
  for (const listener of listeners) listener()
}

function getSnapshot(): AppSettings {
  return cache
}

function getServerSnapshot(): AppSettings {
  return mockSettings
}

async function load() {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase.from("settings").select("*").maybeSingle()
      if (data) {
        cache = settingsFromRow(data, mockSettings)
        publish()
      }
    } finally {
      loaded = true
      inFlight = null
    }
  })()
  return inFlight
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  if (!loaded) void load()
  return () => listeners.delete(onChange)
}

async function write(next: AppSettings) {
  const previous = cache
  cache = next
  publish()

  const supabase = createClient()
  const { error } = await supabase.from("settings").update(settingsToRow(next)).
    // The row belongs to the signed-in user; RLS makes this the only one
    // reachable, and the filter keeps PostgREST from refusing a blanket update.
    not("user_id", "is", null)

  if (error) {
    cache = previous
    publish()
  }
}

export function updateSettings(patch: Partial<AppSettings>) {
  void write({ ...cache, ...patch })
}

export function setNotification(
  key: NotificationKey,
  channel: "inApp" | "email",
  value: boolean
) {
  void write({
    ...cache,
    notifications: {
      ...cache.notifications,
      [key]: { ...cache.notifications[key], [channel]: value },
    },
  })
}

/** Forgets the loaded row so the next account does not inherit it. */
export function resetSettings() {
  cache = mockSettings
  loaded = false
  publish()
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
