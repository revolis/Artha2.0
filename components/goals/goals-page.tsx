"use client"

import * as React from "react"
import { GoalCard } from "@/components/goals/goal-card"
import { GoalFormDialog } from "@/components/goals/goal-form-dialog"
import { AppShell } from "@/components/layout/app-shell"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { newId } from "@/lib/id"
import { useGoals } from "@/lib/use-goals"
import { useSettings } from "@/lib/use-settings"
import type { Goal } from "@/lib/types"

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function GoalsPage() {
  // Subscribing re-renders every amount when the display currency changes.
  useSettings()
  const { goals, setGoals } = useGoals()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Goal | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditing(goal)
    setDialogOpen(true)
  }

  function handleSave(saved: Goal) {
    setGoals((prev) =>
      prev.some((g) => g.id === saved.id)
        ? prev.map((g) => (g.id === saved.id ? saved : g))
        : [saved, ...prev]
    )
  }

  function handleDelete(goal: Goal) {
    setGoals((prev) => prev.filter((g) => g.id !== goal.id))
  }

  function handleToggleDashboard(goal: Goal) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id ? { ...g, showOnDashboard: !g.showOnDashboard } : g
      )
    )
  }

  function handleMarkCompleted(goal: Goal) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, currentAmount: g.targetAmount, completedAt: todayIso() }
          : g
      )
    )
  }

  function handleDuplicate(goal: Goal) {
    setGoals((prev) => [
      {
        ...goal,
        id: newId(),
        title: `${goal.title} (copy)`,
        currentAmount: 0,
        completedAt: undefined,
        showOnDashboard: false,
      },
      ...prev,
    ])
  }

  const actions = {
    onEdit: openEdit,
    onDelete: handleDelete,
    onToggleDashboard: handleToggleDashboard,
    onMarkCompleted: handleMarkCompleted,
    onDuplicate: handleDuplicate,
  }

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
        <InteractiveHoverButton onClick={openCreate}>
          New Goal
        </InteractiveHoverButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} actions={actions} />
        ))}
      </div>

      <GoalFormDialog
        key={dialogOpen ? (editing?.id ?? "create") : "closed"}
        goal={editing}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        onSave={handleSave}
      />
    </AppShell>
  )
}
