"use client"

// The profile photo, wherever it appears.
//
// Three places draw this — the sidebar, the profile card and the profile form
// — and all three used to carry their own copy of "photo if there is one,
// otherwise a preset". That was fine when the photo arrived with the profile.
// Now it has to be fetched from Storage, and having the fetching written out
// three times is how one of them ends up subtly different.

import { getAvatarPreset, PresetAvatar } from "@/components/profile/avatar-presets"
import { avatarUrl } from "@/lib/avatars"
import { useStoredUrl } from "@/lib/use-stored-url"
import { cn } from "@/lib/utils"

export function ProfileAvatar({
  avatarPath,
  avatarId,
  className,
}: {
  avatarPath?: string
  avatarId?: string
  className?: string
}) {
  const { url } = useStoredUrl(avatarPath, avatarUrl)

  // The preset stands in whenever there is no photo — including while one is
  // being signed for, and if signing fails. It is a complete picture rather
  // than a placeholder, so there is nothing to apologise for in the meantime.
  if (!avatarPath || !url) {
    return (
      <PresetAvatar preset={getAvatarPreset(avatarId)} className={className} />
    )
  }

  return (
    // Signed URLs are temporary and the photo is 256px square already, so
    // next/image would add an optimisation step and nothing else.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={cn("object-cover", className)} />
  )
}
