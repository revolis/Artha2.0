"use client"

import * as React from "react"

import { Paperclip } from "@/components/icons"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AttachmentImage } from "@/components/entries/attachment-image"
import { normaliseAttachments } from "@/lib/attachments"
import { externalHref, linkLabel } from "@/lib/links"
import type { Entry, EntryAttachment, Source } from "@/lib/types"

/**
 * The panel revealed under an entry: the note in full, and any images as
 * thumbnails that open to a full-size preview.
 */
export function EntryDetailRow({
  entry,
  colSpan,
  source,
}: {
  entry: Entry
  colSpan: number
  /** The entry's source, so its handle and links have somewhere to be seen. */
  source?: Source
}) {
  const [preview, setPreview] = React.useState<EntryAttachment | null>(null)
  const attachments = React.useMemo(
    () => normaliseAttachments(entry.attachments),
    [entry.attachments]
  )

  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={colSpan} className="bg-muted/30 py-4">
          <div className="flex flex-col gap-4">
            {entry.note ? (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Note
                </span>
                {/* Wraps rather than truncating — this is the full text. */}
                <p className="max-w-3xl text-sm leading-relaxed whitespace-pre-wrap">
                  {entry.note}
                </p>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                No note on this entry.
              </span>
            )}

            {/* Where it came from. The entry form asks for a handle, a
                platform link and a campaign link when a source is created,
                and until now stored all three and showed none of them —
                written once and never readable again. */}
            {source &&
            (source.socialHandle ||
              source.platformUrl ||
              source.campaignUrl) ? (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {source.name}
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {source.socialHandle ? (
                    <span className="text-muted-foreground">
                      {source.socialHandle}
                    </span>
                  ) : null}
                  {(
                    [
                      ["Platform", source.platformUrl],
                      ["Campaign", source.campaignUrl],
                    ] as const
                  ).map(([label, value]) => {
                    if (!value) return null
                    const href = externalHref(value)
                    return (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{label}</span>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            // noreferrer as well as noopener: the target page
                            // has no business knowing where the click came from.
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 hover:text-foreground"
                          >
                            {linkLabel(value)}
                          </a>
                        ) : (
                          // Not a link we are willing to follow — shown as
                          // text so it can still be read and corrected.
                          <span className="text-muted-foreground">{value}</span>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {attachments.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  <Paperclip className="size-3" />
                  {attachments.length}{" "}
                  {attachments.length === 1 ? "image" : "images"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((item) =>
                    item.path ? (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setPreview(item)}
                        aria-label={`Preview ${item.name}`}
                        className="size-20 overflow-hidden rounded-lg border transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <AttachmentImage
                          path={item.path}
                          name={item.name}
                          className="size-full object-cover"
                        />
                      </button>
                    ) : (
                      // Seed rows and anything saved before images were kept
                      // carry a filename only, so say that rather than
                      // pretending there is a picture behind it.
                      <AttachmentImage
                        key={item.name}
                        path={undefined}
                        name={item.name}
                        className="size-20 rounded-lg"
                      />
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </TableCell>
      </TableRow>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-6">
              <span className="truncate">{preview?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Attached to this entry. Only you can open it.
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <AttachmentImage
              path={preview.path}
              name={preview.name}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Small paperclip + count shown on the collapsed row. */
export function AttachmentCount({ entry }: { entry: Entry }) {
  const count = normaliseAttachments(entry.attachments).length
  if (count === 0) return null
  return (
    <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
      <Paperclip className="size-3" />
      {count}
    </span>
  )
}
