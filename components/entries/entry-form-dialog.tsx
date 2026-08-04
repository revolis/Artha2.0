"use client"

import * as React from "react"
import { ImagePlus, X } from "lucide-react"

import {
  CreatableCombobox,
  CreatableMultiCombobox,
} from "@/components/entries/creatable-combobox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
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
import type { Entry, EntryType, Source } from "@/lib/types"

export const entryTypeLabels: Record<EntryType, string> = {
  profit: "Profit",
  loss: "Loss",
  p2p: "P2P",
  fee: "Fee",
  tax: "Tax",
  transfer: "Transfer",
}

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

export function EntryFormDialog({
  entry,
  open,
  onOpenChange,
  sources,
  categoryOptions,
  tagOptions,
  onSave,
}: EntryFormDialogProps) {
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
  const [note, setNote] = React.useState(entry?.note ?? "")
  const [attachments, setAttachments] = React.useState<string[]>(
    entry?.attachments ?? []
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const existingSource = sourceName
    ? sources.find((s) => s.name.toLowerCase() === sourceName.toLowerCase())
    : undefined
  const isNewSource = !!sourceName && !existingSource

  const amount = Number(amountText.replace(/[^0-9.]/g, ""))
  const canSave = amount > 0 && !!datetime

  function handleAttach(event: React.ChangeEvent<HTMLInputElement>) {
    const names = Array.from(event.target.files ?? []).map((f) => f.name)
    if (names.length > 0) {
      setAttachments((prev) => Array.from(new Set([...prev, ...names])))
    }
    event.target.value = ""
  }

  function handleSave() {
    if (!canSave) return
    onSave(
      {
        id: entry?.id ?? `e_${Date.now()}`,
        datetime,
        type,
        category: category ?? undefined,
        tags,
        sourceId: existingSource?.id, // page fills this in for a new source
        amount,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            />
          </Field>
          {isNewSource ? (
            <div className="flex flex-col gap-4 rounded-lg border p-4">
              <p className="text-sm font-medium">
                New source: {sourceName}
              </p>
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
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus data-icon="inline-start" />
                Attach images
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAttach}
              />
              {attachments.map((name) => (
                <Badge key={name} variant="secondary" className="gap-1">
                  {name}
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() =>
                      setAttachments((prev) => prev.filter((n) => n !== name))
                    }
                    className="flex items-center"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button disabled={!canSave} onClick={handleSave}>
            {entry ? "Save Changes" : "Add Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
