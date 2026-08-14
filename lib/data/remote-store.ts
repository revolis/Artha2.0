"use client"

// A small store that hydrates from Supabase once and then serves from memory.
//
// The shape is deliberately the same as the localStorage stores it replaces —
// useSyncExternalStore over a module-level cache — so the twenty-odd call sites
// did not have to change. What changed is that the first snapshot is empty and
// the real one arrives a moment later, which every page already handles because
// an empty ledger was always a possible state.
//
// Writes are optimistic: the cache updates and the screen redraws immediately,
// then the request goes out. If it fails the cache is rolled back and the error
// is surfaced, because silently keeping a change that was never saved is worse
// than showing it disappear.

import * as React from "react"

import { sessionReady } from "@/lib/supabase/client"

export type Status = "idle" | "loading" | "ready" | "error"

interface StoreState<T> {
  items: T[]
  status: Status
  error: string | null
}

export interface RemoteStore<T> {
  useItems: () => StoreState<T>
  /** Replace the whole collection, persisting the difference. */
  mutate: (updater: (prev: T[]) => T[]) => Promise<void>
  /** Drop everything and reload — used on sign-in and sign-out. */
  reset: () => void
  load: () => Promise<void>
}

export function createRemoteStore<T extends { id: string }>(options: {
  /** Reads the whole collection for the signed-in user. */
  fetchAll: () => Promise<T[]>
  /**
   * Works out what changed between two versions of the collection and writes
   * it. Given both so it can tell an insert from an update from a delete.
   */
  persist: (next: T[], prev: T[]) => Promise<void>
}): RemoteStore<T> {
  const EMPTY: T[] = []

  let items: T[] = EMPTY
  let status: Status = "idle"
  let error: string | null = null
  let inFlight: Promise<void> | null = null

  const listeners = new Set<() => void>()
  // A new object per change, so useSyncExternalStore sees a new snapshot.
  let snapshot: StoreState<T> = { items, status, error }

  function publish() {
    snapshot = { items, status, error }
    for (const listener of listeners) listener()
  }

  function getSnapshot() {
    return snapshot
  }

  // The server has no session, so it always renders the empty state. Held as
  // one frozen object: returning a fresh one would loop the store forever.
  const SERVER_SNAPSHOT: StoreState<T> = {
    items: EMPTY,
    status: "loading",
    error: null,
  }
  function getServerSnapshot() {
    return SERVER_SNAPSHOT
  }

  async function load() {
    if (inFlight) return inFlight
    status = "loading"
    error = null
    publish()

    inFlight = (async () => {
      try {
        // Never race the session. An unauthenticated read returns no rows
        // rather than failing, and this store would file that as a good load.
        await sessionReady()
        items = await options.fetchAll()
        status = "ready"
      } catch (cause) {
        error = cause instanceof Error ? cause.message : "Could not load."
        status = "error"
      } finally {
        inFlight = null
        publish()
      }
    })()

    return inFlight
  }

  function subscribe(onChange: () => void) {
    listeners.add(onChange)
    // First subscriber pulls the data down.
    if (status === "idle") void load()
    return () => listeners.delete(onChange)
  }

  async function mutate(updater: (prev: T[]) => T[]) {
    const previous = items
    const next = updater(previous)
    items = next
    error = null
    publish()

    try {
      await options.persist(next, previous)
    } catch (cause) {
      items = previous
      error = cause instanceof Error ? cause.message : "Could not save."
      publish()
      throw cause
    }
  }

  function reset() {
    items = EMPTY
    status = "idle"
    error = null
    publish()
  }

  function useItems() {
    return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  }

  return { useItems, mutate, reset, load }
}

/** Splits two versions of a collection into what has to be written. */
export function diffById<T extends { id: string }>(next: T[], prev: T[]) {
  const before = new Map(prev.map((item) => [item.id, item]))
  const after = new Map(next.map((item) => [item.id, item]))

  const inserted = next.filter((item) => !before.has(item.id))
  const updated = next.filter((item) => {
    const old = before.get(item.id)
    return old !== undefined && JSON.stringify(old) !== JSON.stringify(item)
  })
  const deletedIds = prev
    .filter((item) => !after.has(item.id))
    .map((item) => item.id)

  return { inserted, updated, deletedIds }
}
