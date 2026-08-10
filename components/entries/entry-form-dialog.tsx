"use client"

import * as React from "react"
import { ImagePlus, X } from "@/components/icons"

import {
  CreatableCombobox,
  CreatableMultiCombobox,
} from "@/components/entries/creatable-combobox"
import { Button } from "@/components/ui/button"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AttachmentImage } from "@/components/entries/attachment-image"
import {
  normaliseAttachments,
  removeAttachmentObjects,
  uploadAttachment,
} from "@/lib/attachments"
import { newId } from "@/lib/id"
import { useEntryData } from "@/lib/use-entry-data"
import type { Entry, EntryAttachment, EntryType, Source } from "@/lib/types"

export const entryTypeLabels: Record<EntryType, string> = {
  profit: "Profit",
  loss: "Loss",
  p2p: "Fiat/P2P",
  fee: "Fee",
  tax: "Tax",
  transfer: "Transfer",
}

type P2PDirection = "usd-to-cash" | "cash-to-usd"

const directionItems: { value: P2PDirection; label: string }[] = [
  { value: "usd-to-cash", label: "USD → Cash (Sold USD)" },
  { value: "cash-to-usd", label: "Cash → USD (Bought USD)" },
]

const cashCurrencyItems = ["NPR", "INR", "USD", "EUR", "GBP", "AED"].map(
  (c) => ({ value: c, label: c })
)

const typeItems = (
  Object.entries(entryTypeLabels) as [EntryType, string][]
).map(([value, label]) => ({ value, label }))

function nowLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface EntryFormDialogProps {
  entry: Entry | null // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
  sources: Source[]
  categoryOptions: string[]
  tagOptions: string[]
  // newSource is set when the user typed a source that doesn't exist yet
  onSave: (entry: Entry, newSource?: Omit<Source, "id">) => void
}

type ManageKind = "source" | "category" | "tag"
type Managing = { kind: ManageKind; mode: "edit" | "delete"; name: string }

export function EntryFormDialog({
  entry,
  open,
  onOpenChange,
  sources,
  categoryOptions,
  tagOptions,
  onSave,
}: EntryFormDialogProps) {
  // Taken from the shared store rather than passed down: three pages open this
  // dialog, and threading seven more callbacks through all of them to reach
  // one panel is a lot of wiring for no extra clarity.
  const {
    updateSource,
    deleteSource,
    renameCategory,
    deleteCategory,
    renameTag,
    deleteTag,
    usage,
  } = useEntryData()

  const [managing, setManaging] = React.useState<Managing | null>(null)
  const [draftName, setDraftName] = React.useState("")
  const [draftHandle, setDraftHandle] = React.useState("")
  const [draftPlatform, setDraftPlatform] = React.useState("")
  const [draftCampaign, setDraftCampaign] = React.useState("")
  const [datetime, setDatetime] = React.useState(entry?.datetime ?? nowLocal())
  const [type, setType] = React.useState<EntryType>(entry?.type ?? "profit")
  const [category, setCategory] = React.useState<string | null>(
    entry?.category ?? null
  )
  const [tags, setTags] = React.useState<string[]>(entry?.tags ?? [])
  const [sourceName, setSourceName] = React.useState<string | null>(
    entry?.sourceId
      ? (sources.find((s) => s.id === entry.sourceId)?.name ?? null)
      : null
  )
  const [sourceHandle, setSourceHandle] = React.useState("")
  const [sourcePlatformUrl, setSourcePlatformUrl] = React.useState("")
  const [sourceCampaignUrl, setSourceCampaignUrl] = React.useState("")
  const [amountText, setAmountText] = React.useState(
    entry ? String(entry.amount) : ""
  )
  const [direction, setDirection] = React.useState<P2PDirection>(
    entry?.p2p?.direction ?? "usd-to-cash"
  )
  const [cashCurrency, setCashCurrency] = React.useState(
    entry?.p2p?.cashCurrency ?? "NPR"
  )
  const [rateText, setRateText] = React.useState(
    entry?.p2p ? String(entry.p2p.rate) : ""
  )
  const [note, setNote] = React.useState(entry?.note ?? "")
  const [attachments, setAttachments] = React.useState<EntryAttachment[]>(() =>
    normaliseAttachments(entry?.attachments)
  )
  const [attachError, setAttachError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Images upload as they are picked, before there is an entry to hang them
  // on. These two refs are how the dialog cleans up after itself: anything
  // uploaded here that the user does not go on to save has to be deleted, or
  // the bucket fills with pictures no entry points at.
  const uploadedHere = React.useRef<string[]>([])
  const wasSaved = React.useRef(false)

  const existingSource = sourceName
    ? sources.find((s) => s.name.toLowerCase() === sourceName.toLowerCase())
    : undefined
  const isNewSource = !!sourceName && !existingSource

  const amount = Number(amountText.replace(/[^0-9.]/g, ""))
  const isP2P = type === "p2p"
  const rate = Number(rateText.replace(/[^0-9.]/g, ""))
  const cashAmount = amount > 0 && rate > 0 ? amount * rate : 0
  const canSave = amount > 0 && !!datetime && (!isP2P || rate > 0)

  async function handleAttach(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return

    setAttachError(null)
    setUploading(true)
    const added: EntryAttachment[] = []
    for (const file of files) {
      try {
        const attachment = await uploadAttachment(file)
        added.push(attachment)
        if (attachment.path) uploadedHere.current.push(attachment.path)
      } catch (error) {
        setAttachError(
          error instanceof Error
            ? error.message
            : "Could not attach that image."
        )
      }
    }
    setUploading(false)
    if (added.length === 0) return

    // Keyed by name, so re-picking the same file replaces rather than doubles.
    setAttachments((prev) => {
      const byName = new Map(prev.map((item) => [item.name, item]))
      for (const item of added) byName.set(item.name, item)
      return [...byName.values()]
    })
  }

  function handleRemoveAttachment(target: EntryAttachment) {
    setAttachments((prev) => prev.filter((item) => item.name !== target.name))

    // Only delete the picture now if it was uploaded in this sitting and so
    // has never belonged to a saved entry. One that came with the entry stays
    // put until the save goes through — otherwise cancelling after removing an
    // image would destroy it anyway.
    if (target.path && uploadedHere.current.includes(target.path)) {
      uploadedHere.current = uploadedHere.current.filter(
        (path) => path !== target.path
      )
      void removeAttachmentObjects([target.path])
    }
  }

  /** Throws away images uploaded here if the dialog closes without saving. */
  function handleOpenChange(next: boolean) {
    if (!next && !wasSaved.current && uploadedHere.current.length > 0) {
      void removeAttachmentObjects(uploadedHere.current)
      uploadedHere.current = []
    }
    onOpenChange(next)
  }

  function handleSave() {
    if (!canSave) return
    wasSaved.current = true
    onSave(
      {
        id: entry?.id ?? newId(),
        datetime,
        type,
        category: category ?? undefined,
        tags,
        sourceId: existingSource?.id, // page fills this in for a new source
        amount,
        p2p: isP2P ? { direction, cashCurrency, rate, cashAmount } : undefined,
        note: note.trim() ? note.trim() : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      isNewSource
        ? {
            name: sourceName!,
            socialHandle: sourceHandle.trim() || undefined,
            platformUrl: sourcePlatformUrl.trim() || undefined,
            campaignUrl: sourceCampaignUrl.trim() || undefined,
          }
        : undefined
    )
    onOpenChange(false)
  }

  function startEdit(kind: ManageKind, name: string) {
    setDraftName(name)
    if (kind === "source") {
      const found = sources.find((item) => item.name === name)
      setDraftHandle(found?.socialHandle ?? "")
      setDraftPlatform(found?.platformUrl ?? "")
      setDraftCampaign(found?.campaignUrl ?? "")
    }
    setManaging({ kind, mode: "edit", name })
  }

  function commitEdit() {
    if (!managing) return
    const next = draftName.trim()
    if (!next) return
    if (managing.kind === "source") {
      const found = sources.find((item) => item.name === managing.name)
      if (found) {
        updateSource({
          ...found,
          name: next,
          socialHandle: draftHandle.trim() || undefined,
          platformUrl: draftPlatform.trim() || undefined,
          campaignUrl: draftCampaign.trim() || undefined,
        })
        // The field holds a name, so a rename has to be followed here or the
        // entry would be saved against a source that no longer goes by it.
        if (sourceName === managing.name) setSourceName(next)
      }
    } else if (managing.kind === "category") {
      renameCategory(managing.name, next)
      if (category === managing.name) setCategory(next)
    } else {
      renameTag(managing.name, next)
      setTags((prev) => prev.map((t) => (t === managing.name ? next : t)))
    }
    setManaging(null)
  }

  function commitDelete() {
    if (!managing) return
    if (managing.kind === "source") {
      const found = sources.find((item) => item.name === managing.name)
      if (found) {
        deleteSource(found.id)
        if (sourceName === managing.name) setSourceName(null)
      }
    } else if (managing.kind === "category") {
      deleteCategory(managing.name)
      if (category === managing.name) setCategory(null)
    } else {
      deleteTag(managing.name)
      setTags((prev) => prev.filter((t) => t !== managing.name))
    }
    setManaging(null)
  }

  function usageOf(kind: ManageKind, name: string): number {
    if (kind === "source") {
      const found = sources.find((item) => item.name === name)
      return found ? usage.source(found.id) : 0
    }
    return kind === "category" ? usage.category(name) : usage.tag(name)
  }

  const actionsFor = (kind: ManageKind) => ({
    onEdit: (name: string) => startEdit(kind, name),
    onDelete: (name: string) => setManaging({ kind, mode: "delete", name }),
  })

  const managePanel =
    managing === null ? null : managing.mode === "edit" ? (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <p className="text-sm font-medium">
          Edit {managing.kind}: {managing.name}
        </p>
        <Field>
          <FieldLabel htmlFor="manage-name">Name</FieldLabel>
          <Input
            id="manage-name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
        </Field>
        {managing.kind === "source" ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="manage-handle">Social Handle</FieldLabel>
                <Input
                  id="manage-handle"
                  placeholder="@handle"
                  value={draftHandle}
                  onChange={(e) => setDraftHandle(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="manage-platform">Platform Link</FieldLabel>
                <Input
                  id="manage-platform"
                  placeholder="https://…"
                  value={draftPlatform}
                  onChange={(e) => setDraftPlatform(e.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="manage-campaign">Campaign Link</FieldLabel>
              <Input
                id="manage-campaign"
                placeholder="https://…"
                value={draftCampaign}
                onChange={(e) => setDraftCampaign(e.target.value)}
              />
            </Field>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Renaming updates {usageOf(managing.kind, managing.name)}{" "}
            {usageOf(managing.kind, managing.name) === 1 ? "entry" : "entries"}.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setManaging(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={commitEdit} disabled={!draftName.trim()}>
            Save {managing.kind}
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-sm font-medium">
          Delete {managing.kind} &quot;{managing.name}&quot;?
        </p>
        <p className="text-xs text-muted-foreground">
          {/* Never silent about what it touches: the count is the whole
              decision, and none of these deletes an entry. */}
          {usageOf(managing.kind, managing.name)}{" "}
          {usageOf(managing.kind, managing.name) === 1 ? "entry" : "entries"}{" "}
          {managing.kind === "source"
            ? "will keep their amounts and lose the source."
            : managing.kind === "category"
              ? "will keep their amounts and lose the category."
              : "will keep their amounts and lose the tag."}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setManaging(null)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={commitDelete}>
            Delete {managing.kind}
          </Button>
        </div>
      </div>
    )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit entry" : "Add entry"}</DialogTitle>
          <DialogDescription>
            {entry
              ? "Update the details of this entry."
              : "Record a profit, loss, or money movement."}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="entry-datetime">Date &amp; Time</FieldLabel>
              <Input
                id="entry-datetime"
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="entry-type">Type</FieldLabel>
              <Select
                items={typeItems}
                value={type}
                onValueChange={(value) => setType(value as EntryType)}
              >
                <SelectTrigger id="entry-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {typeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="entry-category">Category</FieldLabel>
              <CreatableCombobox
                id="entry-category"
                value={category}
                onValueChange={setCategory}
                options={categoryOptions}
                placeholder="Pick or create…"
                createLabel="category"
                actions={actionsFor("category")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="entry-tags">Tags</FieldLabel>
              <CreatableMultiCombobox
                id="entry-tags"
                values={tags}
                onValuesChange={setTags}
                options={tagOptions}
                placeholder="Pick or create…"
                createLabel="tag"
                actions={actionsFor("tag")}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="entry-source">Source</FieldLabel>
            <CreatableCombobox
              id="entry-source"
              value={sourceName}
              onValueChange={setSourceName}
              options={sources.map((s) => s.name)}
              placeholder="Pick or create…"
              createLabel="source"
              actions={actionsFor("source")}
            />
          </Field>

          {/* One panel for all three, directly under the fields it belongs to,
              rather than a dialog stacked on a dialog. */}
          {managePanel}
          {isNewSource ? (
            <div className="flex flex-col gap-4 rounded-lg border p-4">
              <p className="text-sm font-medium">New source: {sourceName}</p>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="source-handle">Social Handle</FieldLabel>
                  <Input
                    id="source-handle"
                    placeholder="@handle"
                    value={sourceHandle}
                    onChange={(e) => setSourceHandle(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="source-platform">
                    Platform Link
                  </FieldLabel>
                  <Input
                    id="source-platform"
                    placeholder="https://…"
                    value={sourcePlatformUrl}
                    onChange={(e) => setSourcePlatformUrl(e.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="source-campaign">Campaign Link</FieldLabel>
                <Input
                  id="source-campaign"
                  placeholder="https://…"
                  value={sourceCampaignUrl}
                  onChange={(e) => setSourceCampaignUrl(e.target.value)}
                />
              </Field>
            </div>
          ) : null}
          {isP2P ? (
            <div className="flex flex-col gap-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Fiat/P2P exchange</p>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="p2p-direction">Direction</FieldLabel>
                  <Select
                    items={directionItems}
                    value={direction}
                    onValueChange={(value) =>
                      setDirection(value as P2PDirection)
                    }
                  >
                    <SelectTrigger id="p2p-direction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {directionItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="p2p-currency">Cash Currency</FieldLabel>
                  <Select
                    items={cashCurrencyItems}
                    value={cashCurrency}
                    onValueChange={(value) => setCashCurrency(value as string)}
                  >
                    <SelectTrigger id="p2p-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {cashCurrencyItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="p2p-rate">Rate</FieldLabel>
                  <Input
                    id="p2p-rate"
                    placeholder={`${cashCurrency} per $1`}
                    inputMode="decimal"
                    value={rateText}
                    onChange={(e) => setRateText(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="entry-amount">USD Amount</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="entry-amount"
                      placeholder="0.00"
                      inputMode="decimal"
                      value={amountText}
                      onChange={(e) => setAmountText(e.target.value)}
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="p2p-cash-amount">Cash Amount</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>{cashCurrency}</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="p2p-cash-amount"
                      readOnly
                      tabIndex={-1}
                      placeholder="Auto"
                      value={
                        cashAmount > 0
                          ? cashAmount.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })
                          : ""
                      }
                    />
                  </InputGroup>
                </Field>
              </div>
            </div>
          ) : (
            <Field>
              <FieldLabel htmlFor="entry-amount">Amount (USD)</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="entry-amount"
                  placeholder="0.00"
                  inputMode="decimal"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                />
              </InputGroup>
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="entry-note">Note</FieldLabel>
            <Textarea
              id="entry-note"
              placeholder="What happened in this entry…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus data-icon="inline-start" />
                {uploading ? "Uploading…" : "Attach images"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAttach}
              />
            </div>

            {attachError ? (
              <p className="text-xs text-destructive">{attachError}</p>
            ) : null}

            {/* Thumbnails rather than filenames — you can see what you attached. */}
            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {attachments.map((item) => (
                  <div
                    key={item.name}
                    className="group relative size-16 overflow-hidden rounded-lg border bg-muted/40"
                  >
                    <AttachmentImage
                      path={item.path}
                      name={item.name}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => handleRemoveAttachment(item)}
                      className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-md bg-background/85 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Field>
        </FieldGroup>
        <DialogFooter>
          {/* handleOpenChange, not onOpenChange: closing this way still has to
              throw away images uploaded during this sitting. */}
          <InteractiveHoverButton onClick={() => handleOpenChange(false)}>
            Cancel
          </InteractiveHoverButton>
          <InteractiveHoverButton disabled={!canSave} onClick={handleSave}>
            {entry ? "Save Changes" : "Add Entry"}
          </InteractiveHoverButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
