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

  // --- Managing the things entries are filed under ------------------------
  //
  // A source is a row, so editing one is an update and every entry pointing at
  // it follows by id. Categories and tags are not rows — they are text held on
  // each entry — so renaming one means rewriting every entry that carries it,
  // and deleting one means taking it off them. All three are done in a single
  // store mutation so the whole rename lands or none of it does.

  const updateSource = React.useCallback((next: Source) => {
    void sourcesStore
      .mutate((prev) => prev.map((s) => (s.id === next.id ? next : s)))
      .catch(() => {})
  }, [])

  const deleteSource = React.useCallback((id: string) => {
    // entries.source_id is ON DELETE SET NULL, so the entries survive and are
    // simply no longer attributed. Nothing to clean up on this side.
    void sourcesStore
      .mutate((prev) => prev.filter((s) => s.id !== id))
      .catch(() => {})
  }, [])

  const renameCategory = React.useCallback((from: string, to: string) => {
    const target = to.trim()
    if (!target || target === from) return
    void entriesStore
      .mutate((prev) =>
        prev.map((e) => (e.category === from ? { ...e, category: target } : e))
      )
      .catch(() => {})
  }, [])

  const deleteCategory = React.useCallback((name: string) => {
    void entriesStore
      .mutate((prev) =>
        prev.map((e) =>
          e.category === name ? { ...e, category: undefined } : e
        )
      )
      .catch(() => {})
  }, [])

  const renameTag = React.useCallback((from: string, to: string) => {
    const target = to.trim()
    if (!target || target === from) return
    void entriesStore
      .mutate((prev) =>
        prev.map((e) =>
          e.tags.includes(from)
            ? // Set, because an entry already carrying both would otherwise end
              // up with the same tag twice.
              {
                ...e,
                tags: Array.from(
                  new Set(e.tags.map((t) => (t === from ? target : t)))
                ),
              }
            : e
        )
      )
      .catch(() => {})
  }, [])

  const deleteTag = React.useCallback((name: string) => {
    void entriesStore
      .mutate((prev) =>
        prev.map((e) =>
          e.tags.includes(name)
            ? { ...e, tags: e.tags.filter((t) => t !== name) }
            : e
        )
      )
      .catch(() => {})
  }, [])

  /** How many entries a rename or a delete would touch, for the warning. */
  const usage = React.useMemo(
    () => ({
      source: (id: string) => entries.filter((e) => e.sourceId === id).length,
      category: (name: string) =>
        entries.filter((e) => e.category === name).length,
      tag: (name: string) =>
        entries.filter((e) => e.tags.includes(name)).length,
    }),
    [entries]
  )

  return {
    entries,
    setEntries,
    sources,
    categoryOptions,
    tagOptions,
    saveEntry,
    updateSource,
    deleteSource,
    renameCategory,
    deleteCategory,
    renameTag,
    deleteTag,
    usage,
  }
}
