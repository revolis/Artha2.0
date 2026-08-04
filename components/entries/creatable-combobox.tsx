"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"

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

interface CreatableComboboxProps {
  value: string | null
  onValueChange: (value: string | null) => void
  options: string[]
  placeholder: string
  createLabel?: string // e.g. "category", "source" — used in the Create row
  id?: string
}

// Pick one existing option or type to create a new one.
export function CreatableCombobox({
  value,
  onValueChange,
  options,
  placeholder,
  createLabel = "option",
  id,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  function select(next: string) {
    onValueChange(next === value ? null : next)
    setOpen(false)
    setQuery("")
  }

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
                  <Check
                    className={cn(option !== value && "invisible")}
                  />
                  {option}
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
            {values.length === 0
              ? placeholder
              : `${values.length} selected`}
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
                onClick={() => onValuesChange(values.filter((v) => v !== value))}
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
