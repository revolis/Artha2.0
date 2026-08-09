"use client"

import * as React from "react"
import { GoalCard } from "@/components/goals/goal-card"
import { GoalFormDialog } from "@/components/goals/goal-form-dialog"
import { AppShell } from "@/components/layout/app-shell"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { YearSwitcher } from "@/components/dashboard/year-switcher"
import { newId } from "@/lib/id"
import { goalCoversYear } from "@/lib/goals"
import { useEntries } from "@/lib/local-store"
import { useGoals } from "@/lib/use-goals"
import { useGoalsWithProgress } from "@/lib/use-goal-progress"
import { CURRENT_YEAR, useSelectedYear } from "@/lib/use-selected-year"
import { useSettings } from "@/lib/use-settings"
import { useDashboardYears } from "@/lib/use-years"
import type { Goal } from "@/lib/types"

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function GoalsPage() {
  // Subscribing re-renders every amount when the display currency changes.
  useSettings()
  const { goals, setGoals } = useGoals()
  const { items: entries } = useEntries()

  const categoryOptions = React.useMemo(
    () =>
      Array.from(
        new Set(entries.map((e) => e.category).filter(Boolean) as string[])
      ).sort(),
    [entries]
  )
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Goal | null>(null)

  // The same year the dashboard and every other page is on.
  const [selectedYear, setSelectedYear] = useSelectedYear()
  const { years, addYear, forgetYear } = useDashboardYears(
    entries,
    CURRENT_YEAR
  )

  // Progress comes from the entries, so a goal is never stuck at zero simply
  // because nobody went back in to type a number.
  const withProgress = useGoalsWithProgress(goals)

  // A goal belongs to the year or years its period spans. Showing all of them
  // at once meant 2025's finished targets sat beside 2027's untouched ones
  // with nothing to say which was which.
  const visible = React.useMemo(
    () => withProgress.filter((goal) => goalCoversYear(goal, selectedYear)),
    [withProgress, selectedYear]
  )

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

      <YearSwitcher
        years={years}
        selectedYear={selectedYear}
        currentYear={CURRENT_YEAR}
        onSelectYear={(year) => {
          addYear(year)
          setSelectedYear(year)
        }}
        onRequestDeleteYear={(year) => {
          // Deleting a year's entries belongs on the dashboard, where the
          // export prompt and hold-to-confirm guard that loss. Here the tab
          // simply stops being offered.
          forgetYear(year)
          if (selectedYear === year) setSelectedYear(CURRENT_YEAR)
        }}
      />

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No goals covering {selectedYear} yet. Create one and it will track
          itself from your entries.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((goal) => (
            <GoalCard key={goal.id} goal={goal} actions={actions} />
          ))}
        </div>
      )}

      <GoalFormDialog
        key={dialogOpen ? (editing?.id ?? "create") : "closed"}
        goal={editing}
        categoryOptions={categoryOptions}
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
