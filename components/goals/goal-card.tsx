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
import { Progress } from "@/components/ui/progress"
import {
  getGoalPercent,
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
  const percent = getGoalPercent(goal)
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const status = getGoalStatus(goal)
  const StatusIcon = statusIcons[status.tone]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          {goal.title}
          {goal.showOnDashboard ? (
            <Pin
              className="size-3.5 text-muted-foreground"
              aria-label="Shown on dashboard"
            />
          ) : null}
        </CardTitle>
        <CardDescription>{formatPeriod(goal)}</CardDescription>
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
