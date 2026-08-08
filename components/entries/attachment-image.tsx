"use client"

// Renders an attachment that lives in Storage.
//
// The bucket is private, so there is no URL to put in a src attribute until one
// has been signed for. That makes displaying an image asynchronous, and this is
// the one place that has to know it: everywhere else passes a path and gets a
// picture.

import * as React from "react"

import { attachmentUrl } from "@/lib/attachments"
import { cn } from "@/lib/utils"

/**
 * Resolves a stored path to a link the browser can load.
 *
 * Signing happens when the image is first shown rather than when the entry
 * loads, because most attachments are behind a collapsed row and are never
 * looked at. Links are cached in lib/attachments, so opening the same image
 * twice does not sign it twice.
 */
function useAttachmentUrl(path: string | undefined) {
  // The path is held alongside the result rather than cleared when it changes,
  // so that switching images reads as "not resolved yet" without the effect
  // having to reset anything on its way in.
  const [resolved, setResolved] = React.useState<{
    path: string
    url: string | null
  } | null>(null)

  React.useEffect(() => {
    if (!path) return
    let active = true

    void attachmentUrl(path).then((url) => {
      // The row may have collapsed while the link was being signed.
      if (active) setResolved({ path, url })
    })

    return () => {
      active = false
    }
  }, [path])

  const current = resolved?.path === path ? resolved : null
  return { url: current?.url ?? null, failed: current?.url === null }
}

export function AttachmentImage({
  path,
  name,
  className,
}: {
  path: string | undefined
  name: string
  className?: string
}) {
  const { url, failed } = useAttachmentUrl(path)

  // No path at all: seed data and anything saved when attachments were just
  // filenames. Say so rather than showing a broken frame.
  if (!path || failed) {
    return (
      <span
        title={
          failed
            ? "This image could not be loaded"
            : "No image stored for this attachment"
        }
        className={cn(
          "flex items-center justify-center border border-dashed px-1.5 text-center text-[10px] break-all text-muted-foreground",
          className
        )}
      >
        {name}
      </span>
    )
  }

  if (!url) {
    return (
      <span
        className={cn("animate-pulse bg-muted", className)}
        aria-label={`Loading ${name}`}
      />
    )
  }

  return (
    // Signed URLs are temporary and already sized down on upload, so next/image
    // would only add an optimisation step in front of an image that is small
    // and about to expire.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className={className} />
  )
}
