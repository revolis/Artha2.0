"use client"

// Profile state for the design phase: seeded from mock data and persisted in
// localStorage, so edits survive reloads. Swaps for a real backend later.

import * as React from "react"

import { mockUser } from "@/lib/mock-data"
import type { UserProfile } from "@/lib/types"

const STORAGE_KEY = "artha.profile"

let cache: UserProfile | null = null
const listeners = new Set<() => void>()

function load(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      // Merge over the seed so profiles saved before a field existed still work.
      return { ...mockUser, ...(JSON.parse(raw) as Partial<UserProfile>) }
    }
  } catch {
    // corrupted or unavailable storage — fall back to the seed
  }
  return mockUser
}

function getSnapshot(): UserProfile {
  if (cache === null) cache = load()
  return cache
}

function getServerSnapshot(): UserProfile {
  return mockUser
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function saveProfile(profile: UserProfile) {
  cache = profile
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // storage full or blocked — the change still applies for this session
  }
  for (const listener of listeners) listener()
}

export function useProfile() {
  const profile = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return { profile, saveProfile }
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

export function validateUsername(value: string): string | null {
  if (value.trim() === "") return "Pick a username."
  if (!USERNAME_PATTERN.test(value)) {
    return "3–20 characters, lowercase letters, numbers and underscores only."
  }
  return null
}

/** Which profile fields are filled in, for the completeness meter. */
export function getProfileCompletion(profile: UserProfile) {
  const checks: { label: string; done: boolean }[] = [
    { label: "Username", done: validateUsername(profile.username) === null },
    { label: "Full name", done: profile.name.trim().length > 0 },
    { label: "Email", done: profile.email.trim().length > 0 },
    {
      label: "Profile photo",
      done: Boolean(profile.avatarUrl || profile.avatarId),
    },
    { label: "Bio", done: (profile.bio ?? "").trim().length > 0 },
    { label: "Location", done: (profile.location ?? "").trim().length > 0 },
    { label: "Website", done: (profile.website ?? "").trim().length > 0 },
    { label: "A social link", done: profile.socials.length > 0 },
  ]
  const done = checks.filter((check) => check.done).length
  return {
    checks,
    done,
    total: checks.length,
    percent: (done / checks.length) * 100,
  }
}
