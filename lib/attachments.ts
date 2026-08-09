"use client"

// Entry attachments: taking an image off the file picker into Storage, and
// getting it back out again.
//
// The images used to live in the database as base64 data URLs. They are in a
// private bucket now, so what an entry carries is a path — the bytes are
// fetched only when a picture is actually on screen.

import { resizeToJpeg } from "@/lib/images"
import { removeObjects, signedUrl, uploadObject } from "@/lib/storage"
import type { EntryAttachment } from "@/lib/types"

const BUCKET = "entry-attachments"

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
  const blob = await resizeToJpeg(file, {
    mode: "fit",
    maxEdge: 900,
    quality: 0.82,
  })

  try {
    const path = await uploadObject(BUCKET, blob)
    return { name: file.name, path }
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : "upload failed"
    throw new Error(`Could not upload ${file.name}: ${reason}`)
  }
}

/** Deletes attachment images nothing points at any more. */
export function removeAttachmentObjects(paths: string[]): Promise<void> {
  return removeObjects(BUCKET, paths)
}

/** A displayable URL for a stored attachment, or null if it cannot be read. */
export function attachmentUrl(path: string): Promise<string | null> {
  return signedUrl(BUCKET, path)
}
