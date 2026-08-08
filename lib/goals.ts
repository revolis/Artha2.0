// Goal helpers: progress math and the plain-English status summary
// shown at the bottom of every goal card.

import type { Goal } from "@/lib/types"

/**
 * Whether a goal's period touches a given year. A goal running July to March
 * belongs to both years it crosses. One with no dates at all isn't tied to a
 * year, so it shows against every one.
 */
export function goalCoversYear(goal: Goal, year: number): boolean {
  if (!goal.startDate && !goal.endDate) return true
  const startYear = goal.startDate ? Number(goal.startDate.slice(0, 4)) : year
  const endYear = goal.endDate ? Number(goal.endDate.slice(0, 4)) : year
  return year >= startYear && year <= endYear
}

export function getGoalPercent(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
}

/** Unclamped — goes past 100 when the goal was overshot. */
export function getGoalRawPercent(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0
  return (goal.currentAmount / goal.targetAmount) * 100
}

export interface GoalSlice {
  key: "completed" | "remaining" | "exceed"
  label: string
  amount: number
  /** Share of the target, so 120 means 20% past it. */
  percent: number
}

/**
 * The goal split into the parts the gauge draws. "exceed" only appears once
 * the goal is past its target, and "remaining" disappears at that point.
 */
export function getGoalSlices(goal: Goal): GoalSlice[] {
  const target = Math.max(0, goal.targetAmount)
  const current = Math.max(0, goal.currentAmount)
  const raw = getGoalRawPercent(goal)

  const completed = Math.min(current, target)
  const remaining = Math.max(0, target - current)
  const exceed = Math.max(0, current - target)

  const slices: GoalSlice[] = [
    {
      key: "completed",
      label: "Completed",
      amount: completed,
      percent: Math.min(raw, 100),
    },
  ]

  if (remaining > 0) {
    slices.push({
      key: "remaining",
      label: "Remaining",
      amount: remaining,
      percent: Math.max(0, 100 - raw),
    })
  }

  if (exceed > 0) {
    slices.push({
      key: "exceed",
      label: "Exceeded",
      amount: exceed,
      percent: raw - 100,
    })
  }

  return slices
}

export function isGoalCompleted(goal: Goal): boolean {
  return goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount
}

// getGoalStatus and its plain-English messages used to live here. The cards
// stopped showing them, so the whole thing was dead weight carrying the last
// formatMoney dependency in this file.
