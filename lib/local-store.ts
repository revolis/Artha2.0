"use client"

// Entries and sources, from the database.
//
// The name is a leftover: this was a localStorage store, and keeping the module
// path and the { items, set } shape meant the pages reading it did not have to
// change when the data moved. `set` still takes the same updater — the store
// works out which rows that implies inserting, updating and deleting.

import { entriesStore, sourcesStore } from "@/lib/data/stores"
import type { Entry, Source } from "@/lib/types"

type Updater<T> = (prev: T[]) => T[]

export function useEntries(): {
  items: Entry[]
  set: (updater: Updater<Entry>) => void
  loading: boolean
  error: string | null
} {
  const { items, status, error } = entriesStore.useItems()
  return {
    items,
    // Fire and forget: the store rolls the change back and publishes the error
    // if the write fails, so there is nothing useful to await here.
    set: (updater) => void entriesStore.mutate(updater).catch(() => {}),
    loading: status === "loading",
    error,
  }
}

export function useSources(): {
  items: Source[]
  set: (updater: Updater<Source>) => void
  loading: boolean
  error: string | null
} {
  const { items, status, error } = sourcesStore.useItems()
  return {
    items,
    set: (updater) => void sourcesStore.mutate(updater).catch(() => {}),
    loading: status === "loading",
    error,
  }
}
