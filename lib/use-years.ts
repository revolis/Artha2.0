"use client"

// Years opened by hand on the dashboard, from the database.
//
// Only the empty ones need storing: a year that holds entries appears on its
// own, so this table exists for the case of opening next year to plan ahead
// before a single entry is in it.

import * as React from "react"

import { getEntryYear } from "@/lib/mock-data"
import { createClient } from "@/lib/supabase/client"
import type { Entry } from "@/lib/types"

// A stable empty array. Returning a fresh `[]` from the snapshot would look
// like new state on every render and spin useSyncExternalStore forever.
const NO_YEARS: number[] = []

let cache: number[] = NO_YEARS
let loaded = false
let inFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function publish() {
  for (const listener of listeners) listener()
}

function getSnapshot(): number[] {
  return cache
}

function getServerSnapshot(): number[] {
  return NO_YEARS
}

async function load() {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase.from("dashboard_years").select("year")
      if (data) {
        cache = data.map((row) => row.year).sort((a, b) => a - b)
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

/** Forgets the loaded years so the next account does not inherit them. */
export function resetYears() {
  cache = NO_YEARS
  loaded = false
  publish()
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
    if (cache.includes(year)) return
    cache = [...cache, year].sort((a, b) => a - b)
    publish()
    void createClient().from("dashboard_years").insert({ year })
  }, [])

  // Called when a year is deleted. The entries go too, so dropping it from
  // this list is enough to make the tab disappear.
  const forgetYear = React.useCallback((year: number) => {
    cache = cache.filter((item) => item !== year)
    publish()
    void createClient().from("dashboard_years").delete().eq("year", year)
  }, [])

  return { years, addYear, forgetYear }
}
