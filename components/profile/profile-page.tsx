"use client"

import * as React from "react"
import {
  Check,
  Copy,
  ImagePlus,
  Link2,
  Plus,
  Trash2,
  Upload,
} from "@/components/icons"

import {
  AVATAR_PRESETS,
  getAvatarPreset,
  PresetAvatar,
} from "@/components/profile/avatar-presets"
import { SocialIcon } from "@/components/profile/social-icons"
import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useEntryData } from "@/lib/use-entry-data"
import { useGoals } from "@/lib/use-goals"
import {
  getProfileCompletion,
  useProfile,
  validateUsername,
} from "@/lib/use-profile"
import { getEntryYear } from "@/lib/mock-data"
import type { SocialLink, UserProfile } from "@/lib/types"
import { cn } from "@/lib/utils"

const TIMEZONES = [
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
]

const SOCIAL_SUGGESTIONS = [
  "X",
  "GitHub",
  "LinkedIn",
  "Telegram",
  "Discord",
  "YouTube",
  "Instagram",
  "Reddit",
]

const MAX_AVATAR_PX = 256
const BIO_LIMIT = 160

const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * Shrinks an uploaded image to a square thumbnail before it is stored.
 * Full-size photos as data URLs blow past the localStorage quota.
 */
function readImageAsThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read that file."))
    reader.onload = () => {
      const image = new window.Image()
      image.onerror = () => reject(new Error("That file isn't a valid image."))
      image.onload = () => {
        const size = Math.min(image.width, image.height)
        const canvas = document.createElement("canvas")
        canvas.width = MAX_AVATAR_PX
        canvas.height = MAX_AVATAR_PX
        const context = canvas.getContext("2d")
        if (!context) {
          reject(new Error("Could not process that image."))
          return
        }
        context.drawImage(
          image,
          (image.width - size) / 2,
          (image.height - size) / 2,
          size,
          size,
          0,
          0,
          MAX_AVATAR_PX,
          MAX_AVATAR_PX
        )
        resolve(canvas.toDataURL("image/jpeg", 0.85))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const { saveProfile } = useProfile()
  const { entries, sources } = useEntryData()
  const { goals } = useGoals()

  const [draft, setDraft] = React.useState<UserProfile>(profile)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const usernameError = validateUsername(draft.username)
  const completion = getProfileCompletion(draft)
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile)
  const profileUrl = `artha.app/@${draft.username || "username"}`

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function updateSocial(id: string, patch: Partial<SocialLink>) {
    update(
      "socials",
      draft.socials.map((link) =>
        link.id === id ? { ...link, ...patch } : link
      )
    )
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setUploadError(null)
    try {
      const dataUrl = await readImageAsThumbnail(file)
      setDraft((prev) => ({ ...prev, avatarUrl: dataUrl }))
      setSaved(false)
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not use that image."
      )
    }
  }

  function handleSave() {
    if (usernameError) return
    saveProfile(draft)
    setSaved(true)
  }

  async function copyProfileUrl() {
    try {
      await navigator.clipboard.writeText(`https://${profileUrl}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const activeYears = new Set(entries.map(getEntryYear)).size
  const memberSince = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${draft.createdAt}T00:00:00`))

  const stats = [
    { label: "Member since", value: memberSince },
    { label: "Entries logged", value: String(entries.length) },
    { label: "Years active", value: String(activeYears) },
    { label: "Sources tracked", value: String(sources.length) },
    { label: "Goals set", value: String(goals.length) },
  ]

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Account
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <Button variant="ghost" onClick={() => setDraft(profile)}>
              Discard
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={!dirty || !!usernameError}>
            {saved && !dirty ? "Saved" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile photo</CardTitle>
            <CardDescription>
              Upload your own, or pick one of the built-in avatars.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              {draft.avatarUrl ? (
                // Data URL from the local file picker, so next/image would add
                // nothing but configuration.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.avatarUrl}
                  alt=""
                  className="size-20 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <PresetAvatar
                  preset={getAvatarPreset(draft.avatarId)}
                  className="size-20 rounded-full ring-2 ring-border"
                />
              )}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload data-icon="inline-start" />
                  Upload photo
                </Button>
                {draft.avatarUrl ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => update("avatarUrl", undefined)}
                  >
                    <Trash2 data-icon="inline-start" />
                    Remove photo
                  </Button>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </div>
            </div>

            {uploadError ? (
              <p className="text-sm text-destructive">{uploadError}</p>
            ) : null}

            <Separator />

            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <ImagePlus className="size-4" />
                Built-in avatars
              </span>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((preset) => {
                  const selected =
                    !draft.avatarUrl && draft.avatarId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-label={preset.name}
                      aria-pressed={selected}
                      onClick={() => {
                        setDraft((prev) => ({
                          ...prev,
                          avatarId: preset.id,
                          avatarUrl: undefined,
                        }))
                        setSaved(false)
                      }}
                      className={cn(
                        "rounded-full ring-offset-2 ring-offset-background transition-all hover:scale-105",
                        selected ? "ring-2 ring-ring" : "ring-1 ring-border"
                      )}
                    >
                      <PresetAvatar
                        preset={preset}
                        className="size-full rounded-full"
                      />
                    </button>
                  )
                })}
              </div>
              {draft.avatarUrl ? (
                <p className="text-xs text-muted-foreground">
                  Remove your photo to use one of these instead.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>How you appear across Artha.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={usernameError ? true : undefined}>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>@</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="username"
                      value={draft.username}
                      aria-invalid={usernameError ? true : undefined}
                      onChange={(event) =>
                        update("username", event.target.value.toLowerCase())
                      }
                    />
                  </InputGroup>
                  {usernameError ? (
                    <p className="text-sm text-destructive">{usernameError}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {profileUrl}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Copy profile link"
                        onClick={copyProfileUrl}
                      >
                        {copied ? <Check /> : <Copy />}
                      </Button>
                    </div>
                  )}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="full-name">Full name</FieldLabel>
                    <Input
                      id="full-name"
                      value={draft.name}
                      onChange={(event) => update("name", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={draft.email}
                      onChange={(event) => update("email", event.target.value)}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="bio">Bio</FieldLabel>
                  <Input
                    id="bio"
                    maxLength={BIO_LIMIT}
                    placeholder="A line about how you invest."
                    value={draft.bio ?? ""}
                    onChange={(event) => update("bio", event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(draft.bio ?? "").length}/{BIO_LIMIT}
                  </p>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="location">Location</FieldLabel>
                    <Input
                      id="location"
                      placeholder="City, Country"
                      value={draft.location ?? ""}
                      onChange={(event) =>
                        update("location", event.target.value)
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                    <Select
                      items={TIMEZONES.map((zone) => ({
                        value: zone,
                        label: zone,
                      }))}
                      value={draft.timezone ?? "UTC"}
                      onValueChange={(value) =>
                        update("timezone", value as string)
                      }
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {TIMEZONES.map((zone) => (
                            <SelectItem key={zone} value={zone}>
                              {zone}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>
                Your website and the places people can find you.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Link2 />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="website"
                    placeholder="https://yoursite.com"
                    value={draft.website ?? ""}
                    onChange={(event) => update("website", event.target.value)}
                  />
                </InputGroup>
              </Field>

              <Separator />

              {draft.socials.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No social links yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {draft.socials.map((link) => (
                    <div
                      key={link.id}
                      className="grid gap-2 sm:grid-cols-[160px_1fr_auto]"
                    >
                      {/* The logo updates as the platform is typed, so it's
                          obvious the name was recognised. */}
                      <InputGroup>
                        <InputGroupAddon>
                          <SocialIcon
                            platform={link.platform}
                            className="size-4"
                          />
                        </InputGroupAddon>
                        <InputGroupInput
                          aria-label="Platform"
                          list="social-suggestions"
                          placeholder="Platform"
                          value={link.platform}
                          onChange={(event) =>
                            updateSocial(link.id, {
                              platform: event.target.value,
                            })
                          }
                        />
                      </InputGroup>
                      <Input
                        aria-label="Profile URL"
                        placeholder="https://…"
                        value={link.url}
                        onChange={(event) =>
                          updateSocial(link.id, { url: event.target.value })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${link.platform || "link"}`}
                        onClick={() =>
                          update(
                            "socials",
                            draft.socials.filter((item) => item.id !== link.id)
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <datalist id="social-suggestions">
                {SOCIAL_SUGGESTIONS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <Button
                variant="outline"
                className="w-fit"
                onClick={() =>
                  update("socials", [
                    ...draft.socials,
                    { id: `s_${Date.now()}`, platform: "", url: "" },
                  ])
                }
              >
                <Plus data-icon="inline-start" />
                Add social link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile strength</CardTitle>
            <CardDescription>
              {completion.done} of {completion.total} details filled in.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Progress value={completion.percent} />
            <div className="flex flex-wrap gap-2">
              {completion.checks.map((check) => (
                <Badge
                  key={check.label}
                  variant={check.done ? "secondary" : "outline"}
                  className={cn(!check.done && "text-muted-foreground")}
                >
                  {check.done ? <Check /> : null}
                  {check.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account snapshot</CardTitle>
            <CardDescription>
              What you have built up in Artha so far.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export function ProfilePage() {
  const { profile } = useProfile()
  const mounted = useMounted()

  return (
    <AppShell>
      {mounted ? (
        // Mounting after hydration means the form's initial state is the
        // stored profile rather than the server's placeholder.
        <ProfileForm profile={profile} />
      ) : (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </AppShell>
  )
}
