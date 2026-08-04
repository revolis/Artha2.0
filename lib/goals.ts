// Goal helpers: progress math and the plain-English status summary
// shown at the bottom of every goal card.

import { formatMoney } from "@/lib/mock-data"
import type { Goal } from "@/lib/types"

const DAY_MS = 86_400_000

export function getGoalPercent(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
}

export function isGoalCompleted(goal: Goal): boolean {
  return goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount
}

export type GoalStatusTone = "success" | "warning" | "overdue" | "neutral"

export interface GoalStatus {
  tone: GoalStatusTone
  message: string
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`))
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

export function getGoalStatus(goal: Goal, now = new Date()): GoalStatus {
  const percent = getGoalPercent(goal)
  const start = goal.startDate ? new Date(`${goal.startDate}T00:00:00`) : null
  const end = goal.endDate ? new Date(`${goal.endDate}T23:59:59`) : null

  if (isGoalCompleted(goal)) {
    if (goal.completedAt && end) {
      const diff = daysBetween(new Date(`${goal.completedAt}T00:00:00`), end)
      if (diff > 0) {
        return {
          tone: "success",
          message: `Completed on ${fmtDate(goal.completedAt)} — ${diff} days ahead of schedule`,
        }
      }
      if (diff === 0) {
        return {
          tone: "success",
          message: `Completed right on the target date (${fmtDate(goal.completedAt)})`,
        }
      }
      return {
        tone: "warning",
        message: `Completed on ${fmtDate(goal.completedAt)} — ${-diff} days after the target timeframe`,
      }
    }
    if (goal.completedAt) {
      return { tone: "success", message: `Completed on ${fmtDate(goal.completedAt)}` }
    }
    return { tone: "success", message: "Goal completed" }
  }

  if (!end) {
    return { tone: "neutral", message: "No target timeframe set" }
  }

  if (now > end) {
    return {
      tone: "overdue",
      message: `Goal didn't complete in its target timeframe — stopped at ${Math.round(percent)}%`,
    }
  }

  if (start && now < start) {
    return { tone: "neutral", message: `Starts on ${fmtDate(goal.startDate!)}` }
  }

  const daysLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / DAY_MS))
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

  if (start) {
    const expectedPercent =
      ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100
    if (percent >= expectedPercent) {
      return { tone: "success", message: `On track — ${daysLeft} days left` }
    }
    return {
      tone: "warning",
      message: `Behind pace — ${formatMoney(remaining, goal.currency)} to go in ${daysLeft} days`,
    }
  }

  return { tone: "neutral", message: `${daysLeft} days left` }
}
