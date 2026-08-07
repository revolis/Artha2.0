"use client"

// The years the user has opened on the dashboard, kept in localStorage so the
// tabs survive a reload.
//
// Only years added by hand live here. Any year that already has entries shows
// up on its own (see `useDashboardYears` below), so this list exists for the
// other case: opening next year to plan ahead, before a single entry exists.

import * as React from "react"

import { getEntryYear } from "@/lib/mock-data"
import type { Entry } from "@/lib/types"

const STORAGE_KEY = "artha.years.v1"

// A stable empty array. Returning a fresh `[]` from the snapshot would look
// like new state on every render and spin useSyncExternalStore forever.
const NO_YEARS: number[] = []

let cache: number[] | null = null
const listeners = new Set<() => void>()

function load(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is number => typeof item === "number")
      }
    }
  } catch {
    // corrupted or unavailable storage — behave as though nothing was added
  }
  return NO_YEARS
}

function getSnapshot(): number[] {
  if (cache === null) cache = load()
  return cache
}

function getServerSnapshot(): number[] {
  return NO_YEARS
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function setAddedYears(updater: (prev: number[]) => number[]) {
  cache = updater(getSnapshot())
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // storage full or blocked — state still updates for this session
  }
  for (const listener of listeners) listener()
}

/**
 * Every year the dashboard should offer a tab for: this year, every year that
 * has entries, and anything the user opened by hand. Sorted oldest first.
 */
export function useDashboardYears(entries: Entry[], currentYear: number) {
  const added = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const years = React.useMemo(() => {
    const set = new Set<number>([currentYear, ...added])
    for (const entry of entries) set.add(getEntryYear(entry))
    return [...set].sort((a, b) => a - b)
  }, [entries, added, currentYear])

  const addYear = React.useCallback((year: number) => {
    setAddedYears((prev) => (prev.includes(year) ? prev : [...prev, year]))
  }, [])

  // Called when a year is deleted. The entries go too, so dropping it from
  // this list is enough to make the tab disappear.
  const forgetYear = React.useCallback((year: number) => {
    setAddedYears((prev) => prev.filter((item) => item !== year))
  }, [])

  return { years, addYear, forgetYear }
}
