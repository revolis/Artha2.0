"use client"

// Talking to Supabase Storage: signing links, and deleting objects.
//
// Both buckets are private, so nothing has a URL that can simply be put in a
// src attribute — a link has to be signed first, and it expires. That is what
// this module hides. It knows nothing about entries or profiles; the callers
// in lib/attachments.ts and lib/avatars.ts supply the bucket.

import { createClient } from "@/lib/supabase/client"

/** How long a signed link lasts, and how early to replace one. */
const SIGNED_TTL_SECONDS = 60 * 60
const RENEW_MARGIN_MS = 5 * 60 * 1000

function key(bucket: string, path: string) {
  return `${bucket}/${path}`
}

// Signed links, cached until nearly expired. Without this, every re-render of
// an image would ask the server for a new one.
const cache = new Map<string, { url: string; expiresAt: number }>()
const inFlight = new Map<string, Promise<string | null>>()

/** A displayable URL for a stored object, or null if it cannot be read. */
export async function signedUrl(
  bucket: string,
  path: string
): Promise<string | null> {
  const id = key(bucket, path)

  const cached = cache.get(id)
  if (cached && cached.expiresAt - Date.now() > RENEW_MARGIN_MS) {
    return cached.url
  }

  // The same image can be on screen more than once — the profile page shows
  // the avatar beside the sidebar's copy of it. One request covers both.
  const existing = inFlight.get(id)
  if (existing) return existing

  const request = (async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, SIGNED_TTL_SECONDS)
      if (error || !data) return null
      cache.set(id, {
        url: data.signedUrl,
        expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000,
      })
      return data.signedUrl
    } finally {
      inFlight.delete(id)
    }
  })()

  inFlight.set(id, request)
  return request
}

/**
 * Deletes objects nothing points at any more.
 *
 * Failures are swallowed. By the time this runs the row referring to the
 * object is already gone, so a leftover file is untidy rather than wrong, and
 * it is not worth failing a save the user has been told succeeded.
 */
export async function removeObjects(
  bucket: string,
  paths: string[]
): Promise<void> {
  const wanted = paths.filter(Boolean)
  if (wanted.length === 0) return

  const supabase = createClient()
  await supabase.storage.from(bucket).remove(wanted)
  for (const path of wanted) cache.delete(key(bucket, path))
}

/**
 * Uploads a blob and returns its path.
 *
 * The folder is the user's id because that is what both bucket policies check,
 * and the filename is random so that nothing about it can be guessed from the
 * original.
 */
export async function uploadObject(
  bucket: string,
  blob: Blob
): Promise<string> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error("Sign in before uploading images.")

  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: "image/jpeg" })
  if (error) throw new Error(error.message)

  return path
}

/** Forgets every signed link — on sign-out, since they outlive the session. */
export function clearSignedUrls() {
  cache.clear()
  inFlight.clear()
}
