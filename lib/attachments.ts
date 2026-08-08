"use client"

// Entry attachments: reading an image off the file picker, putting it in
// Storage, and getting a URL back out again.
//
// The images used to live in the database as base64 data URLs. They are in a
// private Storage bucket now, so what an entry carries is a path — the bytes
// are fetched only when a picture is actually on screen.

import { createClient } from "@/lib/supabase/client"
import type { EntryAttachment } from "@/lib/types"

const BUCKET = "entry-attachments"
const MAX_EDGE = 900
const QUALITY = 0.82

/** How long a signed link lasts, and how early to replace one. */
const SIGNED_TTL_SECONDS = 60 * 60
const RENEW_MARGIN_MS = 5 * 60 * 1000

/**
 * Attachments used to be plain file names, and later gained an inline image.
 * Anything read back is coerced rather than trusted, so a row from either era
 * still renders.
 */
export function normaliseAttachments(raw: unknown): EntryAttachment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): EntryAttachment | null => {
      if (typeof item === "string") return { name: item }
      if (item && typeof item === "object" && "name" in item) {
        const { name, path } = item as EntryAttachment
        return typeof name === "string" ? { name, path } : null
      }
      return null
    })
    .filter((item): item is EntryAttachment => item !== null)
}

/**
 * Shrinks an image to something worth storing.
 *
 * A phone photo is several megabytes and nothing here displays one larger than
 * a thumbnail, so the long edge is capped and it is re-encoded as JPEG. This
 * mattered more when the result had to fit in localStorage, but it still saves
 * the user's storage quota and makes the picture appear faster.
 */
function downscale(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.onload = () => {
      const image = new window.Image()
      image.onerror = () =>
        reject(new Error(`${file.name} isn't a readable image.`))
      image.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)

        const context = canvas.getContext("2d")
        if (!context) {
          reject(new Error("Could not process that image."))
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Could not process that image."))
          },
          "image/jpeg",
          QUALITY
        )
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads a picked image and returns what the entry should hold.
 *
 * Uploaded when picked rather than when the entry is saved, so that what an
 * entry carries stays plain JSON. The store compares entries by serialising
 * them, and a File does not survive that — an edit that only changed an image
 * would look like no change at all.
 *
 * The cost is that abandoning the dialog leaves the object behind, which is
 * why the dialog deletes what it uploaded when it is cancelled.
 */
export async function uploadAttachment(file: File): Promise<EntryAttachment> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error("Sign in before attaching images.")

  const blob = await downscale(file)
  // The folder is the user's id because that is what the bucket policy checks.
  const path = `${userId}/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" })
  if (error) throw new Error(`Could not upload ${file.name}: ${error.message}`)

  return { name: file.name, path }
}

/**
 * Deletes objects that nothing points at any more.
 *
 * Failures are swallowed: the row is already gone by the time this runs, so a
 * leftover object is untidy but harmless, and it is not worth failing a save
 * the user has already been told succeeded.
 */
export async function removeAttachmentObjects(paths: string[]): Promise<void> {
  const wanted = paths.filter(Boolean)
  if (wanted.length === 0) return
  const supabase = createClient()
  await supabase.storage.from(BUCKET).remove(wanted)
  for (const path of wanted) signedUrls.delete(path)
}

// Signed URLs, cached until they are nearly expired. Without this, every
// re-render of a thumbnail would ask the server for a fresh link.
const signedUrls = new Map<string, { url: string; expiresAt: number }>()
const pending = new Map<string, Promise<string | null>>()

/** A displayable URL for a stored attachment, or null if it cannot be read. */
export async function attachmentUrl(path: string): Promise<string | null> {
  const cached = signedUrls.get(path)
  if (cached && cached.expiresAt - Date.now() > RENEW_MARGIN_MS) {
    return cached.url
  }

  // Several thumbnails of the same image would otherwise each sign their own.
  const existing = pending.get(path)
  if (existing) return existing

  const request = (async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL_SECONDS)
      if (error || !data) return null
      signedUrls.set(path, {
        url: data.signedUrl,
        expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000,
      })
      return data.signedUrl
    } finally {
      pending.delete(path)
    }
  })()

  pending.set(path, request)
  return request
}

/** Forgets every signed link — on sign-out, since they outlive the session. */
export function clearAttachmentUrls() {
  signedUrls.clear()
  pending.clear()
}
