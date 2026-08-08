"use client"

// Goals, from the database. Same { goals, setGoals } shape the localStorage
// version had, so the pages reading it did not change.

import { goalsStore } from "@/lib/data/stores"
import type { Goal } from "@/lib/types"

export function useGoals() {
  const { items, status, error } = goalsStore.useItems()
  return {
    goals: items,
    setGoals: (updater: (prev: Goal[]) => Goal[]) =>
      void goalsStore.mutate(updater).catch(() => {}),
    loading: status === "loading",
    error,
  }
}
