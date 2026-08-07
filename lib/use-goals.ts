"use client"

// Shared goal state for the design phase: seeded from mock data, persisted in
// localStorage so choices like "Show in Dashboard" survive moving between
// pages. Swaps for a real backend later.

import * as React from "react"

import { mockGoals } from "@/lib/mock-data"
import type { Goal } from "@/lib/types"

// Versioned like the entry store: bumping it hands everyone the goals that
// go with the current demo ledger, one set per year.
const STORAGE_KEY = "artha.goals.v2"

let cache: Goal[] | null = null
const listeners = new Set<() => void>()

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Goal[]
  } catch {
    // corrupted or unavailable storage — fall back to the seed data
  }
  return mockGoals
}

function getSnapshot(): Goal[] {
  if (cache === null) cache = load()
  return cache
}

function getServerSnapshot(): Goal[] {
  return mockGoals
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function setGoals(updater: (prev: Goal[]) => Goal[]) {
  cache = updater(getSnapshot())
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // storage full or blocked — state still updates for this session
  }
  for (const listener of listeners) listener()
}

export function useGoals() {
  const goals = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return { goals, setGoals }
}
