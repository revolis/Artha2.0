"use client"

// How far along a goal is, worked out from the ledger.
//
// Progress used to be a number typed in by hand, and the form only offered the
// field when editing — so a new goal was created at zero and stayed there
// until someone went back in and typed a figure. A year with sixty entries
// against it still read 0%, which is not a goal so much as a decoration.
//
// It is derived now: everything earned, less everything lost, spent on fees
// and paid in tax, between the goal's start and end dates. Nothing to keep in
// step by hand, and adding an entry moves every goal whose period covers it.

import * as React from "react"

import { useEntries } from "@/lib/local-store"
import { getNetAmount } from "@/lib/mock-data"
import type { Currency, Entry, Goal } from "@/lib/types"
import { useMoney } from "@/lib/use-money"

/**
 * What the goal has achieved inside its period, in USD.
 *
 * Two different questions, so two different sums:
 *
 * A goal with no category is about coming out ahead — savings, a portfolio
 * target — so it counts net result: earned less lost, spent and taxed.
 *
 * A goal naming a category is about how much of that thing happened, so it
 * counts the amounts themselves. Net would be useless here: tax and fees
 * subtract, so "set aside the annual tax" ran backwards the more tax you
 * actually paid, and P2P nets to nothing by design, so "cash out $10,000"
 * could never move off zero however much you cashed out.
 *
 * Floored at zero either way — a losing period has made no progress toward a
 * target rather than negative progress, and a gauge running backwards says
 * nothing worth reading.
 */
export function goalAchievedUsd(goal: Goal, entries: Entry[]): number {
  let total = 0
  for (const entry of entries) {
    const day = entry.datetime.slice(0, 10)
    if (goal.startDate && day < goal.startDate) continue
    if (goal.endDate && day > goal.endDate) continue

    if (goal.trackCategory) {
      // A goal watching one category ignores everything else. Without this
      // every goal covering the same dates showed an identical figure.
      if (entry.category !== goal.trackCategory) continue
      total += entry.amount
    } else {
      total += getNetAmount(entry)
    }
  }
  return Math.max(0, total)
}

/**
 * The same goals, with progress filled in from the entries.
 *
 * Returning whole Goal objects means every card, gauge and dashboard tile
 * carries on reading `currentAmount` exactly as before — the number is simply
 * true now.
 */
export function useGoalsWithProgress(goals: Goal[]): Goal[] {
  const { items: entries } = useEntries()
  const { convert } = useMoney()

  return React.useMemo(
    () =>
      goals.map((goal) => ({
        ...goal,
        // Marked complete by hand stays complete. That is a statement about
        // the goal, not about the arithmetic, and it should not be argued
        // with by a period that happens to total less.
        currentAmount: goal.completedAt
          ? goal.targetAmount
          : convert(
              goalAchievedUsd(goal, entries),
              "USD" as Currency,
              goal.currency
            ),
      })),
    [goals, entries, convert]
  )
}
