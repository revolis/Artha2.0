"use client"

// The collections, backed by Supabase.
//
// Each store keeps the hook shape the localStorage version had, so the pages
// reading them did not change. Writes go through diffById: the callers all
// hand back a whole new array (`prev => [...]`), and turning that into the
// inserts, updates and deletes it implies keeps every one of those call sites
// working untouched.

import {
  createRemoteStore,
  diffById,
  type RemoteStore,
} from "@/lib/data/remote-store"
import {
  entryFromRow,
  entryToRow,
  goalFromRow,
  goalToRow,
  sourceFromRow,
  sourceToRow,
} from "@/lib/data/mappers"
import { removeAttachmentObjects } from "@/lib/attachments"
import { createClient } from "@/lib/supabase/client"
import type { Entry, Goal, Source } from "@/lib/types"

function fail(context: string, error: { message: string } | null) {
  if (error) throw new Error(`${context}: ${error.message}`)
}

/** Every stored image an entry points at. */
function pathsOf(entries: Entry[]): string[] {
  return entries.flatMap((entry) =>
    (entry.attachments ?? [])
      .map((item) => item.path)
      .filter((path): path is string => Boolean(path))
  )
}

// ------------------------------------------------------------------ entries --

export const entriesStore: RemoteStore<Entry> = createRemoteStore<Entry>({
  async fetchAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("entries")
      .select("*, entry_attachments(name, storage_path)")
      .order("occurred_at", { ascending: false })
    fail("Could not load entries", error)
    return (data ?? []).map(entryFromRow)
  },

  async persist(next, prev) {
    const supabase = createClient()
    const { inserted, updated, deletedIds } = diffById(next, prev)

    if (deletedIds.length > 0) {
      const { error } = await supabase
        .from("entries")
        .delete()
        .in("id", deletedIds)
      fail("Could not delete", error)
    }

    const written = [...inserted, ...updated]
    if (written.length > 0) {
      const { error } = await supabase
        .from("entries")
        .upsert(written.map(entryToRow))
      fail("Could not save entry", error)

      // Attachments are a child table, and an entry's set of them is small, so
      // replacing them wholesale is simpler than diffing and just as cheap.
      for (const entry of written) {
        const { error: clearError } = await supabase
          .from("entry_attachments")
          .delete()
          .eq("entry_id", entry.id)
        fail("Could not update attachments", clearError)

        if (entry.attachments && entry.attachments.length > 0) {
          const { error: addError } = await supabase
            .from("entry_attachments")
            .insert(
              entry.attachments.map((item) => ({
                entry_id: entry.id,
                name: item.name,
                storage_path: item.path ?? null,
              }))
            )
          fail("Could not save attachments", addError)
        }
      }
    }

    // Rows in the child table went with the entry, but the images themselves
    // are in Storage and nothing cascades to them. Anything the new version of
    // the collection no longer mentions is deleted here — covering both an
    // image removed from an entry and an entry deleted outright.
    const stillUsed = new Set(pathsOf(next))
    const orphaned = pathsOf(prev).filter((path) => !stillUsed.has(path))
    await removeAttachmentObjects(orphaned)
  },
})

// ------------------------------------------------------------------ sources --

export const sourcesStore: RemoteStore<Source> = createRemoteStore<Source>({
  async fetchAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .order("created_at", { ascending: true })
    fail("Could not load sources", error)
    return (data ?? []).map(sourceFromRow)
  },

  async persist(next, prev) {
    const supabase = createClient()
    const { inserted, updated, deletedIds } = diffById(next, prev)

    if (deletedIds.length > 0) {
      const { error } = await supabase
        .from("sources")
        .delete()
        .in("id", deletedIds)
      fail("Could not delete source", error)
    }

    const written = [...inserted, ...updated]
    if (written.length > 0) {
      const { error } = await supabase
        .from("sources")
        .upsert(written.map(sourceToRow))
      fail("Could not save source", error)
    }
  },
})

// -------------------------------------------------------------------- goals --

export const goalsStore: RemoteStore<Goal> = createRemoteStore<Goal>({
  async fetchAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: true })
    fail("Could not load goals", error)
    return (data ?? []).map(goalFromRow)
  },

  async persist(next, prev) {
    const supabase = createClient()
    const { inserted, updated, deletedIds } = diffById(next, prev)

    if (deletedIds.length > 0) {
      const { error } = await supabase
        .from("goals")
        .delete()
        .in("id", deletedIds)
      fail("Could not delete goal", error)
    }

    const written = [...inserted, ...updated]
    if (written.length > 0) {
      const { error } = await supabase
        .from("goals")
        .upsert(written.map(goalToRow))
      fail("Could not save goal", error)
    }
  },
})

/** Clears every collection — on sign-out, so the next account starts clean. */
export function resetAllStores() {
  entriesStore.reset()
  sourcesStore.reset()
  goalsStore.reset()
}
