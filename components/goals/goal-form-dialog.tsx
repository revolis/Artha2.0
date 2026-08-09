"use client"

import * as React from "react"

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { newId } from "@/lib/id"
import type { Goal } from "@/lib/types"

type PeriodPreset = "month" | "quarter" | "year" | "custom"

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function presetRange(
  preset: Exclude<PeriodPreset, "custom">,
  now = new Date()
): { from: string; to: string } {
  const year = now.getFullYear()
  if (preset === "month") {
    return {
      from: toIso(new Date(year, now.getMonth(), 1)),
      to: toIso(new Date(year, now.getMonth() + 1, 0)),
    }
  }
  if (preset === "quarter") {
    const quarterStart = Math.floor(now.getMonth() / 3) * 3
    return {
      from: toIso(new Date(year, quarterStart, 1)),
      to: toIso(new Date(year, quarterStart + 3, 0)),
    }
  }
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

function detectPreset(goal: Goal | null): PeriodPreset {
  if (!goal?.startDate || !goal?.endDate) return "year"
  for (const preset of ["month", "quarter", "year"] as const) {
    const range = presetRange(preset)
    if (goal.startDate === range.from && goal.endDate === range.to)
      return preset
  }
  return "custom"
}

function formatPeriodPreview(from?: string, to?: string): string | null {
  if (!from || !to) return null
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return `${fmt.format(new Date(`${from}T00:00:00`))} – ${fmt.format(new Date(`${to}T00:00:00`))}`
}

/** Stands in for "no category filter" — a Select cannot hold an empty value. */
const ALL_INCOME = "__all__"

interface GoalFormDialogProps {
  goal: Goal | null // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Categories already in use, to choose what the goal counts. */
  categoryOptions: string[]
  onSave: (goal: Goal) => void
}

export function GoalFormDialog({
  goal,
  open,
  onOpenChange,
  categoryOptions,
  onSave,
}: GoalFormDialogProps) {
  const [name, setName] = React.useState(goal?.title ?? "")
  const [amountText, setAmountText] = React.useState(
    goal ? String(goal.targetAmount) : ""
  )
  const [tracks, setTracks] = React.useState(goal?.trackCategory ?? ALL_INCOME)

  const trackItems = React.useMemo(
    () => [
      { value: ALL_INCOME, label: "All net income" },
      ...categoryOptions.map((name) => ({ value: name, label: name })),
    ],
    [categoryOptions]
  )
  const [preset, setPreset] = React.useState<PeriodPreset>(detectPreset(goal))
  const [customFrom, setCustomFrom] = React.useState(goal?.startDate ?? "")
  const [customTo, setCustomTo] = React.useState(goal?.endDate ?? "")

  const { from, to } =
    preset === "custom"
      ? { from: customFrom || undefined, to: customTo || undefined }
      : presetRange(preset)

  const targetAmount = Number(amountText.replace(/[^0-9.]/g, ""))
  const validPeriod = preset !== "custom" || (!!from && !!to && from <= to)
  const canSave = name.trim().length > 0 && targetAmount > 0 && validPeriod

  function handleSave() {
    if (!canSave) return
    onSave({
      id: goal?.id ?? newId(),
      title: name.trim(),
      targetAmount,
      // Stored for compatibility; every screen reads the derived figure.
      currentAmount: 0,
      trackCategory: tracks === ALL_INCOME ? undefined : tracks,
      currency: goal?.currency ?? "USD",
      startDate: from,
      endDate: to,
      completedAt: goal?.completedAt,
      showOnDashboard: goal?.showOnDashboard,
    })
    onOpenChange(false)
  }

  const preview = formatPeriodPreview(from, to)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {goal ? "Edit goal" : "Set a new milestone"}
          </DialogTitle>
          <DialogDescription>
            {goal
              ? "Update your target and we'll re-pace your savings."
              : "Define your financial target and we'll help you pace your savings."}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="goal-name">Goal Name</FieldLabel>
            <Input
              id="goal-name"
              placeholder="e.g. New Car, Home Downpayment"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          {/* No "achieved" field any more: progress is added up from the
              entries inside the period below, so there is nothing to keep in
              step by hand — and the field only appeared when editing, which
              left every new goal sitting at zero until someone noticed. */}
          <Field>
            <FieldLabel htmlFor="goal-amount">Target Amount</FieldLabel>
            <Input
              id="goal-amount"
              placeholder="$15,000"
              inputMode="decimal"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="goal-tracks">Counts</FieldLabel>
            <Select
              items={trackItems}
              value={tracks}
              onValueChange={(value) => setTracks(value as string)}
            >
              <SelectTrigger id="goal-tracks">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {trackItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {tracks === ALL_INCOME
                ? "Counts what you came out ahead by: income less loss, fees and tax."
                : `Counts how much ${tracks} adds up to in the period.`}
            </p>
          </Field>
          <Field>
            <FieldLabel>Target Date</FieldLabel>
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[preset]}
              onValueChange={(value: string[]) => {
                if (value[0]) setPreset(value[0] as PeriodPreset)
              }}
            >
              <ToggleGroupItem value="month">This Month</ToggleGroupItem>
              <ToggleGroupItem value="quarter">This Quarter</ToggleGroupItem>
              <ToggleGroupItem value="year">This Year</ToggleGroupItem>
              <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          {preset === "custom" ? (
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="goal-from">From</FieldLabel>
                <Input
                  id="goal-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="goal-to">To</FieldLabel>
                <Input
                  id="goal-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </Field>
            </div>
          ) : null}
          {preview ? (
            <p className="text-xs text-muted-foreground">Period: {preview}</p>
          ) : null}
        </FieldGroup>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <InteractiveHoverButton
            className="w-full"
            disabled={!canSave}
            onClick={handleSave}
          >
            {goal ? "Save Changes" : "Create Goal"}
          </InteractiveHoverButton>
          <InteractiveHoverButton
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </InteractiveHoverButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
