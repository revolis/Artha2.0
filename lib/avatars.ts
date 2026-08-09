"use client"

// The profile photo, in Storage.
//
// It was a data URL in a text column, so every read of a profile carried the
// picture whether or not anything was going to draw it. The profile now holds
// a path, and the bucket is private like the attachments one — a photo of
// someone's face is not something to leave behind a public URL by default.

import { resizeToJpeg } from "@/lib/images"
import { removeObjects, signedUrl, uploadObject } from "@/lib/storage"

const BUCKET = "avatars"

/** Drawn in a circle no larger than 44px, so 256 covers retina comfortably. */
const AVATAR_PX = 256

/** Uploads a picked photo and returns the path to store on the profile. */
export async function uploadAvatar(file: File): Promise<string> {
  const blob = await resizeToJpeg(file, {
    mode: "square",
    size: AVATAR_PX,
    quality: 0.85,
  })

  try {
    return await uploadObject(BUCKET, blob)
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : "upload failed"
    throw new Error(`Could not upload that photo: ${reason}`)
  }
}

/** Deletes a photo the profile no longer points at. */
export function removeAvatar(path: string): Promise<void> {
  return removeObjects(BUCKET, [path])
}

/** A displayable URL for a stored photo, or null if it cannot be read. */
export function avatarUrl(path: string): Promise<string | null> {
  return signedUrl(BUCKET, path)
}
