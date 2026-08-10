"use client"

import * as React from "react"
import {
  Check,
  ChevronsUpDown,
  Pencil,
  Plus,
  Trash2,
  X,
} from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function hasOption(options: string[], query: string): boolean {
  return options.some((o) => o.toLowerCase() === query.toLowerCase())
}

/**
 * Editing and removing an option from the list it appears in.
 *
 * Sources, categories and tags are all created here and, until now, could only
 * ever be created here — a typo was permanent and an unused one stayed on the
 * list forever. Handing the list the two verbs it was missing is cheaper than
 * a page to manage them, and it puts them where they are already being read.
 */
export interface OptionActions {
  onEdit: (option: string) => void
  onDelete: (option: string) => void
}

function RowActions({
  option,
  actions,
}: {
  option: string
  actions: OptionActions
}) {
  // Buttons inside a command item: the click must not also choose the option,
  // which is what the row itself does.
  const stop = (run: () => void) => (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    run()
  }
  return (
    <span className="ml-auto flex items-center gap-0.5">
      <button
        type="button"
        aria-label={`Edit ${option}`}
        onClick={stop(() => actions.onEdit(option))}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Delete ${option}`}
        onClick={stop(() => actions.onDelete(option))}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </span>
  )
}

interface CreatableComboboxProps {
  value: string | null
  onValueChange: (value: string | null) => void
  options: string[]
  placeholder: string
  createLabel?: string // e.g. "category", "source" — used in the Create row
  id?: string
  /** When given, each option carries an edit and a delete control. */
  actions?: OptionActions
}

// Pick one existing option or type to create a new one.
export function CreatableCombobox({
  value,
  onValueChange,
  options,
  placeholder,
  createLabel = "option",
  id,
  actions,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  function select(next: string) {
    onValueChange(next === value ? null : next)
    setOpen(false)
    setQuery("")
  }

  // Editing or deleting opens a panel beneath the field, so the list has to
  // get out of the way first — otherwise the popover covers the thing the
  // click just opened.
  const rowActions = actions
    ? {
        onEdit: (option: string) => {
          setOpen(false)
          actions.onEdit(option)
        },
        onDelete: (option: string) => {
          setOpen(false)
          actions.onDelete(option)
        },
      }
    : undefined

  const trimmed = query.trim()
  const showCreate = trimmed.length > 0 && !hasOption(options, trimmed)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value ?? placeholder}
        </span>
        <ChevronsUpDown data-icon="inline-end" className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type new…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Type to create a new {createLabel}.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => select(option)}
                >
                  <Check className={cn(option !== value && "invisible")} />
                  {option}
                  {rowActions ? (
                    <RowActions option={option} actions={rowActions} />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            {showCreate ? (
              <CommandGroup>
                <CommandItem
                  value={`__create__ ${trimmed}`}
                  onSelect={() => select(trimmed)}
                >
                  <Plus />
                  Create {createLabel} &quot;{trimmed}&quot;
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface CreatableMultiComboboxProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: string[]
  placeholder: string
  createLabel?: string
  id?: string
  actions?: OptionActions
}

// Pick several existing options and/or type to create new ones. Selected
// values render as removable badges under the field.
export function CreatableMultiCombobox({
  values,
  onValuesChange,
  options,
  placeholder,
  createLabel = "tag",
  id,
  actions,
}: CreatableMultiComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  function toggle(option: string) {
    onValuesChange(
      values.includes(option)
        ? values.filter((v) => v !== option)
        : [...values, option]
    )
    setQuery("")
  }

  // Editing or deleting opens a panel beneath the field, so the list has to
  // get out of the way first — otherwise the popover covers the thing the
  // click just opened.
  const rowActions = actions
    ? {
        onEdit: (option: string) => {
          setOpen(false)
          actions.onEdit(option)
        },
        onDelete: (option: string) => {
          setOpen(false)
          actions.onDelete(option)
        },
      }
    : undefined

  const allOptions = Array.from(new Set([...options, ...values]))
  const trimmed = query.trim()
  const showCreate = trimmed.length > 0 && !hasOption(allOptions, trimmed)

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <span
            className={cn(
              "truncate",
              values.length === 0 && "text-muted-foreground"
            )}
          >
            {values.length === 0 ? placeholder : `${values.length} selected`}
          </span>
          <ChevronsUpDown data-icon="inline-end" className="opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or type new…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>Type to create a new {createLabel}.</CommandEmpty>
              <CommandGroup>
                {allOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => toggle(option)}
                  >
                    <Check
                      className={cn(!values.includes(option) && "invisible")}
                    />
                    {option}
                    {rowActions ? (
                      <RowActions option={option} actions={rowActions} />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
              {showCreate ? (
                <CommandGroup>
                  <CommandItem
                    value={`__create__ ${trimmed}`}
                    onSelect={() => toggle(trimmed)}
                  >
                    <Plus />
                    Create {createLabel} &quot;{trimmed}&quot;
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1">
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() =>
                  onValuesChange(values.filter((v) => v !== value))
                }
                className="flex items-center"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
