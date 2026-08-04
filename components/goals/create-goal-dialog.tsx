"use client"

import * as React from "react"
import { CalendarIcon, Plus } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Goal } from "@/lib/types"

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

interface CreateGoalDialogProps {
  onCreate: (goal: Goal) => void
}

export function CreateGoalDialog({ onCreate }: CreateGoalDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [amountText, setAmountText] = React.useState("")
  const [range, setRange] = React.useState<DateRange | undefined>()

  const targetAmount = Number(amountText.replace(/[^0-9.]/g, ""))
  const canCreate = name.trim().length > 0 && targetAmount > 0

  function handleCreate() {
    if (!canCreate) return
    onCreate({
      id: `g_${Date.now()}`,
      title: name.trim(),
      targetAmount,
      currentAmount: 0,
      currency: "USD",
      startDate: range?.from ? toIsoDate(range.from) : undefined,
      endDate: range?.to ? toIsoDate(range.to) : undefined,
    })
    setName("")
    setAmountText("")
    setRange(undefined)
    setOpen(false)
  }

  const periodLabel =
    range?.from && range?.to
      ? `${formatDay(range.from)} – ${formatDay(range.to)}`
      : range?.from
        ? `${formatDay(range.from)} – …`
        : "Pick a period"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        New Goal
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set a new milestone</DialogTitle>
          <DialogDescription>
            Define your financial target and we&apos;ll help you pace your
            savings.
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
          <div className="grid grid-cols-2 gap-4">
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
              <FieldLabel htmlFor="goal-period">Target Date</FieldLabel>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="goal-period"
                      variant="outline"
                      className="justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon data-icon="inline-start" />
                  <span className="truncate">{periodLabel}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    numberOfMonths={2}
                    defaultMonth={range?.from}
                  />
                </PopoverContent>
              </Popover>
            </Field>
          </div>
        </FieldGroup>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            Create Goal
          </Button>
          <DialogClose render={<Button variant="outline" className="w-full" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
