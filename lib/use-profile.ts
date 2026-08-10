"use client"

// The profile, from the database. Created alongside the account by the
// on_auth_user_created trigger, so a signed-in user always has one.
//
// Social links live in their own table but belong to the profile as far as the
// UI is concerned, so they are loaded and saved together. The set is small and
// reordering matters, so a save replaces them wholesale rather than diffing.

import * as React from "react"

import { removeAvatar } from "@/lib/avatars"
import { profileFromRow, profileToRow } from "@/lib/data/mappers"
import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/lib/types"

/**
 * What the app shows before a profile has loaded, and what a signed-out
 * visitor gets on the public pages.
 *
 * Blank on purpose. This used to be `mockUser` from the design phase, which
 * meant an anonymous visitor to /contact found the owner's real email address
 * already filled into the reply-to box.
 */
const BLANK: UserProfile = {
  id: "",
  username: "",
  name: "",
  email: "",
  socials: [],
  createdAt: "",
}

/**
 * The profile and whether it has actually arrived yet.
 *
 * The `loaded` flag matters because forms seed their draft from the profile
 * once, when they mount. Under localStorage the profile was there on the first
 * client render, so that was safe. Coming from the network it is not: a form
 * that mounts too early keeps the placeholder for good. Screens with a draft
 * wait for this flag before rendering.
 */
interface ProfileState {
  profile: UserProfile
  loaded: boolean
}

// One frozen object per state, so useSyncExternalStore sees a stable
// reference between changes instead of a fresh object every render.
const EMPTY: ProfileState = { profile: BLANK, loaded: false }

let cache: ProfileState = EMPTY
let inFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function publish() {
  for (const listener of listeners) listener()
}

function getSnapshot(): ProfileState {
  return cache
}

function getServerSnapshot(): ProfileState {
  return EMPTY
}

async function load() {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const supabase = createClient()
      const [{ data: profile }, { data: socials }, { data: auth }] =
        await Promise.all([
          supabase.from("profiles").select("*").maybeSingle(),
          supabase.from("social_links").select("*"),
          supabase.auth.getUser(),
        ])

      const loadedProfile = profile
        ? profileFromRow(profile, socials ?? [])
        : cache.profile

      // The address someone signs in with is the one they expect to see. A
      // Google sign-up can land in the profiles table with this blank — the
      // provider carries the address in its own metadata and auth.users.email
      // is not always set by the time the row is written — and Settings then
      // showed "Signed in as" followed by nothing at all. Falling back to the
      // session means the screen is right even when the row is not yet.
      const signedInEmail = auth?.user?.email ?? ""
      cache = {
        profile:
          loadedProfile.email.trim() === "" && signedInEmail
            ? { ...loadedProfile, email: signedInEmail }
            : loadedProfile,
        loaded: true,
      }
      publish()
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  if (!cache.loaded) void load()
  return () => listeners.delete(onChange)
}

export function saveProfile(profile: UserProfile) {
  const previous = cache
  cache = { profile, loaded: true }
  publish()

  void (async () => {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    const id = user.user?.id
    if (!id) return

    const { error } = await supabase
      .from("profiles")
      .update(profileToRow(profile))
      .eq("id", id)

    if (error) {
      cache = previous
      publish()
      return
    }

    // The photo that was just replaced is now unreachable. Deleted only after
    // the write succeeds, so a failed save does not destroy the picture the
    // profile has been rolled back to.
    const replaced = previous.profile.avatarPath
    if (replaced && replaced !== profile.avatarPath) {
      void removeAvatar(replaced)
    }

    // Replace the links rather than work out which moved: there are only ever
    // a handful, and position is part of what is being saved.
    await supabase.from("social_links").delete().eq("user_id", id)
    if (profile.socials.length > 0) {
      await supabase.from("social_links").insert(
        profile.socials
          .filter(
            (link) => link.platform.trim() !== "" || link.url.trim() !== ""
          )
          .map((link, index) => ({
            id: link.id,
            platform: link.platform,
            url: link.url,
            position: index,
          }))
      )
    }
  })()
}

/** Forgets the loaded profile so the next account does not inherit it. */
export function resetProfile() {
  cache = EMPTY
  publish()
}

export function useProfile() {
  const state = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return { profile: state.profile, loaded: state.loaded, saveProfile }
}

/**
 * "January 2024" for the Member since stat.
 *
 * Guarded because the join date is genuinely unknown until the profile loads,
 * and on a signed-out visit it never arrives at all. Formatting a blank date
 * throws rather than producing something odd-looking, which is enough to take
 * a whole page down.
 */
export function formatMemberSince(createdAt: string): string {
  if (!createdAt) return "—"
  const date = new Date(`${createdAt}T00:00:00`)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date)
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
      done: Boolean(profile.avatarPath || profile.avatarId),
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
