"use client"

import * as React from "react"
import {
  CheckCircle2,
  Copy,
  LayoutDashboard,
  MoreVertical,
  Pencil,
  Trash2,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GoalGauge, SLICE_FILL } from "@/components/goals/goal-gauge"
import { getGoalSlices, isGoalCompleted, type GoalSlice } from "@/lib/goals"
import { useMoney } from "@/lib/use-money"
import type { Goal } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatPeriod(goal: Goal): string {
  if (!goal.startDate || !goal.endDate) return "No target period"
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return `${fmt.format(new Date(`${goal.startDate}T00:00:00`))} – ${fmt.format(new Date(`${goal.endDate}T00:00:00`))}`
}

type SliceKey = GoalSlice["key"]

interface GoalCardActions {
  onEdit: (goal: Goal) => void
  onDelete: (goal: Goal) => void
  onToggleDashboard: (goal: Goal) => void
  onMarkCompleted: (goal: Goal) => void
  onDuplicate: (goal: Goal) => void
}

interface GoalCardProps {
  goal: Goal
  actions?: GoalCardActions // omit to render a read-only card (e.g. on the dashboard)
}

export function GoalCard({ goal, actions }: GoalCardProps) {
  const { formatMoney } = useMoney()
  const slices = getGoalSlices(goal)
  // Shared so pointing at the arc lights the matching legend row and back,
  // the same link the pie chart has with its legend.
  const [hovered, setHovered] = React.useState<SliceKey | null>(null)

  return (
    <Card size="sm" className="gap-2.5">
      <CardContent className="relative flex flex-col items-center gap-2.5">
        {actions ? (
          <div className="absolute top-0 right-(--card-spacing) z-10">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Goal options"
                  />
                }
              >
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => actions.onEdit(goal)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  {!isGoalCompleted(goal) ? (
                    <DropdownMenuItem
                      onClick={() => actions.onMarkCompleted(goal)}
                    >
                      <CheckCircle2 />
                      Mark as completed
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => actions.onDuplicate(goal)}>
                    <Copy />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => actions.onToggleDashboard(goal)}
                  >
                    <LayoutDashboard />
                    {goal.showOnDashboard
                      ? "Hide from Dashboard"
                      : "Show in Dashboard"}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => actions.onDelete(goal)}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        <GoalGauge
          goal={goal}
          hovered={hovered}
          onHoverChange={setHovered}
          className="mt-1"
        />

        {/* Target amount, a short rule, then the name and period — all centred
            and given room to breathe. */}
        <div className="flex w-full flex-col items-center gap-2.5 text-center">
          <span className="text-sm font-bold tabular-nums">
            <span className="sr-only">Target </span>
            {formatMoney(goal.targetAmount, goal.currency)}
          </span>

          <span aria-hidden className="h-px w-14 rounded-full bg-border" />

          <div className="flex w-full flex-col items-center gap-0.5">
            <span className="max-w-full truncate text-sm font-semibold tracking-tight">
              {goal.title}
            </span>
            <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {formatPeriod(goal)}
            </span>
          </div>
        </div>

        {/* Legend doubles as the figures table — one row per part of the arc,
            and hovering a row lights its notches up. */}
        <div className="flex w-full flex-col gap-0.5">
          {slices.map((slice) => (
            <button
              key={slice.key}
              type="button"
              aria-label={`${slice.label}: ${formatMoney(slice.amount, goal.currency)}`}
              onMouseEnter={() => setHovered(slice.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(slice.key)}
              onBlur={() => setHovered(null)}
              className={cn(
                "flex items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-xs transition-all duration-200 outline-none",
                hovered === slice.key && "bg-accent",
                hovered !== null && hovered !== slice.key && "opacity-40"
              )}
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full transition-transform duration-200"
                style={{
                  background: SLICE_FILL[slice.key],
                  transform: hovered === slice.key ? "scale(1.35)" : undefined,
                }}
              />
              <span className="text-muted-foreground">{slice.label}</span>
              <span className="ml-auto font-medium tabular-nums">
                {formatMoney(slice.amount, goal.currency)}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
