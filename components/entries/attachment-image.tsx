"use client"

// Renders an entry attachment that lives in Storage.

import { attachmentUrl } from "@/lib/attachments"
import { useStoredUrl } from "@/lib/use-stored-url"
import { cn } from "@/lib/utils"

export function AttachmentImage({
  path,
  name,
  className,
}: {
  path: string | undefined
  name: string
  className?: string
}) {
  const { url, failed } = useStoredUrl(path, attachmentUrl)

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
    // Signed URLs are temporary and the image was already sized down on upload,
    // so next/image would only add an optimisation step in front of something
    // small that is about to expire.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className={className} />
  )
}
