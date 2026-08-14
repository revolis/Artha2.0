"use client"

// Switches the currency every amount on the site is shown in, from wherever
// you happen to be.
//
// The setting has always existed, but only in Settings — so changing it meant
// leaving the page you were reading, changing it, and coming back to find
// your place again. It is a way of *looking* at a figure rather than a
// preference you set once, and it belongs next to the other things that change
// how the page reads.
//
// Nothing is converted or rewritten underneath: entries are stored in USD and
// the formatter does the rest, so this only ever changes what is displayed.

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check } from "@/components/icons"
import {
  navIconClass,
  NavIconButton,
} from "@/components/layout/nav-icon-button"
import { CURRENCY_SYMBOLS } from "@/lib/rate-data"
import { CURRENCY_OPTIONS, useSettings } from "@/lib/use-settings"
import type { Currency } from "@/lib/types"
import { cn } from "@/lib/utils"

const emptySubscribe = () => () => {}

/**
 * The stored currency is only known on the client, and the server has to
 * render something. Waiting for mount keeps the two agreeing — otherwise the
 * markup says one symbol and the first paint says another.
 */
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function CurrencySwitcher() {
  const { settings, updateSettings } = useSettings()
  const mounted = useMounted()
  const current: Currency = mounted ? settings.displayCurrency : "USD"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <NavIconButton
            label={`Currency: ${current}`}
            // The glyph is text, not an icon, and some of them are wider than
            // one character — "د.إ" is three. A fixed square would clip them,
            // so the button keeps the row's height and takes the width it
            // needs.
            className={cn(navIconClass, "w-auto min-w-9 px-2")}
          />
        }
      >
        <span className="text-sm leading-none font-semibold tabular-nums">
          {CURRENCY_SYMBOLS[current]}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          {/* The label has to sit inside the group — Base UI throws if a group
              part is rendered without a Group ancestor. */}
          <DropdownMenuLabel>Show amounts in</DropdownMenuLabel>
          {CURRENCY_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => updateSettings({ displayCurrency: option.value })}
            >
              <span className="w-5 text-center text-sm font-medium">
                {CURRENCY_SYMBOLS[option.value]}
              </span>
              <span className="flex-1">{option.label}</span>
              <Check
                className={cn(
                  "size-4",
                  option.value !== current && "invisible"
                )}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
