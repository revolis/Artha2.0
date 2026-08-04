"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatMoney } from "@/lib/mock-data"
import type { Goal } from "@/lib/types"

function formatPeriod(goal: Goal): string {
  if (!goal.startDate || !goal.endDate) return "No target period"
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return `${fmt.format(new Date(goal.startDate))} – ${fmt.format(new Date(goal.endDate))}`
}

export function GoalCard({ goal }: { goal: Goal }) {
  const percent =
    goal.targetAmount > 0
      ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
      : 0
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{goal.title}</CardTitle>
        <CardDescription>{formatPeriod(goal)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-lg font-semibold">
            {percent.toFixed(percent > 0 && percent < 1 ? 1 : 0)}%
          </span>
        </div>
        <Progress value={percent} />
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Achieved</span>
            <span className="text-sm font-medium">
              {formatMoney(goal.currentAmount, goal.currency)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Remaining</span>
            <span className="text-sm font-medium">
              {formatMoney(remaining, goal.currency)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Target</span>
            <span className="text-sm font-medium">
              {formatMoney(goal.targetAmount, goal.currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
