"use client"

// Shared entry/source data + save logic used by every page that can open the
// Add Entry dialog (Entries page, Dashboard, …).

import * as React from "react"

import { entriesStore, sourcesStore } from "@/lib/data/stores"
import { useEntries, useSources } from "@/lib/local-store"
import { newId } from "@/lib/id"
import type { Entry, Source } from "@/lib/types"

export function useEntryData() {
  const { items: entries, set: setEntries } = useEntries()
  const { items: sources } = useSources()

  const categoryOptions = React.useMemo(
    () =>
      Array.from(
        new Set(entries.map((e) => e.category).filter(Boolean) as string[])
      ).sort(),
    [entries]
  )
  const tagOptions = React.useMemo(
    () => Array.from(new Set(entries.flatMap((e) => e.tags))).sort(),
    [entries]
  )

  const saveEntry = React.useCallback(
    (saved: Entry, newSource?: Omit<Source, "id">) => {
      // The stores are used directly rather than through the hooks' `set`
      // because these two writes have an order to them, and `set` fires and
      // forgets. An entry's source is a foreign key: the source row has to be
      // in the database before the entry pointing at it is written, or the
      // insert is rejected and the entry is silently lost. Under localStorage
      // both writes were instant, so the order never showed.
      void (async () => {
        let entryToSave = saved
        if (newSource) {
          const source: Source = { id: newId(), ...newSource }
          await sourcesStore.mutate((prev) => [...prev, source])
          entryToSave = { ...saved, sourceId: source.id }
        }
        await entriesStore.mutate((prev) =>
          prev.some((e) => e.id === entryToSave.id)
            ? prev.map((e) => (e.id === entryToSave.id ? entryToSave : e))
            : [entryToSave, ...prev]
        )
        // Nothing to catch: a failed write rolls its own store back and
        // publishes the error, which is what the page shows.
      })().catch(() => {})
    },
    []
  )

  return {
    entries,
    setEntries,
    sources,
    categoryOptions,
    tagOptions,
    saveEntry,
  }
}
