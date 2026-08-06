"use client"

import {
  CheckCircle2,
  CircleAlert,
  Clock,
  Copy,
  LayoutDashboard,
  MoreVertical,
  Pencil,
  Pin,
  Trash2,
  TriangleAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GoalGauge, SLICE_FILL } from "@/components/goals/goal-gauge"
import {
  getGoalSlices,
  getGoalStatus,
  isGoalCompleted,
  type GoalStatusTone,
} from "@/lib/goals"
import { formatMoney } from "@/lib/mock-data"
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

const statusIcons: Record<GoalStatusTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: TriangleAlert,
  overdue: CircleAlert,
  neutral: Clock,
}

const statusClasses: Record<GoalStatusTone, string> = {
  success: "text-foreground",
  warning: "text-foreground",
  overdue: "text-destructive",
  neutral: "text-muted-foreground",
}

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
  const status = getGoalStatus(goal)
  const StatusIcon = statusIcons[status.tone]
  const slices = getGoalSlices(goal)

  return (
    <Card>
      <CardHeader>
        {/* Period sits above as a quiet eyebrow so the name carries the card. */}
        <CardDescription className="text-[10px] font-medium tracking-[0.16em] uppercase">
          {formatPeriod(goal)}
        </CardDescription>
        <CardTitle className="flex items-center gap-1.5 text-base tracking-tight">
          <span className="truncate">{goal.title}</span>
          {goal.showOnDashboard ? (
            <Pin
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-label="Shown on dashboard"
            />
          ) : null}
        </CardTitle>
        {actions ? (
          <CardAction>
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
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <GoalGauge goal={goal} />

        {/* Legend doubles as the figures table — one row per part of the arc. */}
        <div className="flex flex-col gap-1.5">
          {slices.map((slice) => (
            <div key={slice.key} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: SLICE_FILL[slice.key] }}
              />
              <span className="text-muted-foreground">{slice.label}</span>
              <span className="ml-auto font-medium tabular-nums">
                {formatMoney(slice.amount, goal.currency)}
              </span>
            </div>
          ))}
          <div className="mt-1 flex items-center gap-2 border-t pt-2 text-xs">
            <span className="text-muted-foreground">Target</span>
            <span className="ml-auto font-medium tabular-nums">
              {formatMoney(goal.targetAmount, goal.currency)}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 text-xs",
            statusClasses[status.tone]
          )}
        >
          <StatusIcon className="size-3.5 shrink-0" />
          <span>{status.message}</span>
        </div>
      </CardContent>
    </Card>
  )
}
