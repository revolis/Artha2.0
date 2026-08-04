"use client"

import * as React from "react"

import { CreateGoalDialog } from "@/components/goals/create-goal-dialog"
import { GoalCard } from "@/components/goals/goal-card"
import { AppShell } from "@/components/layout/app-shell"
import { mockGoals } from "@/lib/mock-data"
import type { Goal } from "@/lib/types"

export function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>(mockGoals)

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Goals
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Goals &amp; Milestones
          </h1>
        </div>
        <CreateGoalDialog
          onCreate={(goal) => setGoals((prev) => [goal, ...prev])}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </AppShell>
  )
}
