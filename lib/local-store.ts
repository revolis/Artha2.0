"use client"

// Tiny localStorage-backed store factory for the design phase: state is
// seeded from mock data, shared live between pages, and survives reloads.
// Swaps for a real backend later.

import * as React from "react"

import { mockEntries, mockSources } from "@/lib/mock-data"
import type { Entry, Source } from "@/lib/types"

export function createLocalStore<T>(storageKey: string, seed: T[]) {
  let cache: T[] | null = null
  const listeners = new Set<() => void>()

  function load(): T[] {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return JSON.parse(raw) as T[]
    } catch {
      // corrupted or unavailable storage — fall back to the seed data
    }
    return seed
  }

  function getSnapshot(): T[] {
    if (cache === null) cache = load()
    return cache
  }

  function getServerSnapshot(): T[] {
    return seed
  }

  function subscribe(onChange: () => void) {
    listeners.add(onChange)
    return () => listeners.delete(onChange)
  }

  function set(updater: (prev: T[]) => T[]) {
    cache = updater(getSnapshot())
    try {
      localStorage.setItem(storageKey, JSON.stringify(cache))
    } catch {
      // storage full or blocked — state still updates for this session
    }
    for (const listener of listeners) listener()
  }

  return function useStore() {
    const items = React.useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot
    )
    return { items, set }
  }
}

// The key carries a version. Bumping it hands everyone the new demo ledger
// instead of whatever an earlier visit left in the browser.
export const useEntries = createLocalStore<Entry>(
  "artha.entries.v2",
  mockEntries
)
export const useSources = createLocalStore<Source>(
  "artha.sources.v2",
  mockSources
)
