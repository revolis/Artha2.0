"use client"

// Shared entry/source data + save logic used by every page that can open the
// Add Entry dialog (Entries page, Dashboard, …).

import * as React from "react"

import { useEntries, useSources } from "@/lib/local-store"
import type { Entry, Source } from "@/lib/types"

export function useEntryData() {
  const { items: entries, set: setEntries } = useEntries()
  const { items: sources, set: setSources } = useSources()

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
      let entryToSave = saved
      if (newSource) {
        const source: Source = { id: `s_${Date.now()}`, ...newSource }
        setSources((prev) => [...prev, source])
        entryToSave = { ...saved, sourceId: source.id }
      }
      setEntries((prev) =>
        prev.some((e) => e.id === entryToSave.id)
          ? prev.map((e) => (e.id === entryToSave.id ? entryToSave : e))
          : [entryToSave, ...prev]
      )
    },
    [setEntries, setSources]
  )

  return { entries, setEntries, sources, categoryOptions, tagOptions, saveEntry }
}
