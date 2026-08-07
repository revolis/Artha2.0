"use client"

import * as React from "react"
import { Eye, EyeOff } from "@/components/icons"

import { NavIconButton } from "@/components/layout/nav-icon-button"
import { useSettings } from "@/lib/use-settings"

const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * Hides every amount on the site behind dots. Nothing is changed or deleted —
 * the setting just tells the money formatter to mask its output.
 */
export function PrivacyToggle() {
  const { settings, updateSettings } = useSettings()
  const mounted = useMounted()
  const hidden = mounted && settings.privacyMode

  return (
    <NavIconButton
      label={hidden ? "Show amounts" : "Hide amounts"}
      aria-pressed={hidden}
      onClick={() => updateSettings({ privacyMode: !settings.privacyMode })}
      className={hidden ? "bg-accent text-foreground" : undefined}
    >
      {hidden ? <EyeOff /> : <Eye />}
    </NavIconButton>
  )
}
