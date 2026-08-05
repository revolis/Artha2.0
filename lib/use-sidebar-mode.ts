"use client"

// Sidebar display mode, persisted so the choice survives reloads and stays in
// sync across every page that renders the shell.

import * as React from "react"

export type SidebarMode = "open" | "rail" | "hover" | "hidden"

export const SIDEBAR_MODES: { value: SidebarMode; label: string; hint: string }[] =
  [
    { value: "open", label: "Always Open", hint: "Expanded with labels" },
    { value: "rail", label: "Icon Rail", hint: "Icons only" },
    { value: "hover", label: "Expand on Hover", hint: "Opens when pointed at" },
    { value: "hidden", label: "Hide Sidebar", hint: "Off screen entirely" },
  ]

const STORAGE_KEY = "artha.sidebar-mode"
const DEFAULT_MODE: SidebarMode = "open"

let cache: SidebarMode | null = null
const listeners = new Set<() => void>()

function isMode(value: string | null): value is SidebarMode {
  return value === "open" || value === "rail" || value === "hover" || value === "hidden"
}

function getSnapshot(): SidebarMode {
  if (cache === null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      cache = isMode(stored) ? stored : DEFAULT_MODE
    } catch {
      cache = DEFAULT_MODE
    }
  }
  return cache
}

// The server can't know the stored preference, so it always renders the
// default and the client corrects on hydration.
function getServerSnapshot(): SidebarMode {
  return DEFAULT_MODE
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function setMode(mode: SidebarMode) {
  cache = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // storage blocked — the choice still applies for this session
  }
  for (const listener of listeners) listener()
}

export function useSidebarMode() {
  const mode = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return { mode, setMode }
}
