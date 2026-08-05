"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BadgeCheck,
  Bell,
  Download,
  Info,
  KeyRound,
  LifeBuoy,
  Mail,
  MessageSquare,
  Monitor,
  Moon,
  Palette,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  TriangleAlert,
} from "lucide-react"

import { OtpDialog, generateOtp } from "@/components/settings/otp-dialog"
import {
  SettingsNav,
  type SettingsNavItem,
} from "@/components/settings/settings-nav"
import { AppShell } from "@/components/layout/app-shell"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { HELP_ARTICLES } from "@/lib/help-content"
import { formatMoney } from "@/lib/mock-data"
import { SITE } from "@/lib/site"
import { useProfile } from "@/lib/use-profile"
import {
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_ITEMS,
  TIMEZONE_OPTIONS,
  useSettings,
} from "@/lib/use-settings"
import type { Currency, TimeFormat } from "@/lib/types"

const NAV_ITEMS: SettingsNavItem[] = [
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "general", label: "General", icon: Settings2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "danger", label: "Danger zone", icon: ShieldAlert, destructive: true },
  { id: "feedback", label: "Send feedback", icon: MessageSquare, startsGroup: true },
  { id: "help", label: "Help & support", icon: LifeBuoy },
  { id: "about", label: "About us", icon: Info },
]

const FEEDBACK_TOPICS = [
  { value: "bug", label: "Something is broken" },
  { value: "idea", label: "I have an idea" },
  { value: "confusing", label: "Something is confusing" },
  { value: "praise", label: "Just saying thanks" },
  { value: "other", label: "Something else" },
]

// The five most-asked, pulled from the shared help content so this panel and
// the Help Centre never drift apart.
const FAQS = HELP_ARTICLES.slice(0, 5)

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export function SettingsPage() {
  const router = useRouter()
  const mounted = useMounted()
  const { settings, updateSettings, setNotification } = useSettings()
  const { profile, saveProfile } = useProfile()
  const { theme, setTheme } = useTheme()

  const [section, setSection] = React.useState("security")

  const [otpFlow, setOtpFlow] = React.useState<
    "password" | "email" | "delete" | null
  >(null)
  const [otpCode, setOtpCode] = React.useState("")
  const [passwordOpen, setPasswordOpen] = React.useState(false)
  const [emailOpen, setEmailOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [pendingEmail, setPendingEmail] = React.useState("")
  const [notice, setNotice] = React.useState<string | null>(null)

  const [feedbackTopic, setFeedbackTopic] = React.useState("idea")
  const [feedbackText, setFeedbackText] = React.useState("")
  const [feedbackSent, setFeedbackSent] = React.useState(false)

  function startOtp(flow: "password" | "email" | "delete") {
    setOtpCode(generateOtp())
    setOtpFlow(flow)
  }

  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8
  const canSubmitPassword =
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    (!settings.hasPassword || currentPassword.length > 0)

  return (
    <AppShell>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Account
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SettingsNav items={NAV_ITEMS} active={section} onSelect={setSection} />
        </div>

        {/* Keyed so switching sections remounts and replays the enter animation. */}
        <div
          key={section}
          className="flex min-w-0 flex-col gap-6 duration-300 animate-in fade-in-0 slide-in-from-bottom-2"
        >
          {notice ? (
            <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm duration-300 animate-in fade-in-0">
              <BadgeCheck className="size-4 shrink-0 text-success" />
              {notice}
            </div>
          ) : null}

          {section === "security" ? (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  How you sign in, and how we verify it is you.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl border bg-muted/50">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {settings.loginMethod === "google"
                          ? "Google account"
                          : "Email and password"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {profile.email}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">Current sign-in method</Badge>
                </div>

                {!settings.hasPassword ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed p-4">
                    <div className="flex items-start gap-2">
                      <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          Add a password
                        </span>
                        <p className="text-sm text-muted-foreground">
                          You signed up with Google. Adding a password on{" "}
                          {profile.email} means you can still get in if you ever
                          lose access to Google. We&apos;ll email a code to
                          confirm it is you.
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-fit"
                      onClick={() => {
                        setNewPassword("")
                        setConfirmPassword("")
                        setPasswordOpen(true)
                      }}
                    >
                      Add password
                    </Button>
                  </div>
                ) : null}

                <div className="flex flex-col divide-y">
                  <SettingRow
                    title="Email address"
                    description={`Signed in as ${profile.email}`}
                  >
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPendingEmail("")
                        setEmailOpen(true)
                      }}
                    >
                      Change email
                    </Button>
                  </SettingRow>

                  <SettingRow
                    title="Password"
                    description={
                      settings.hasPassword
                        ? "Last changed when you set it up."
                        : "No password set yet."
                    }
                  >
                    <Button
                      variant="outline"
                      disabled={!settings.hasPassword}
                      onClick={() => {
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmPassword("")
                        setPasswordOpen(true)
                      }}
                    >
                      Change password
                    </Button>
                  </SettingRow>

                  <SettingRow
                    title="Two-factor authentication"
                    description="Ask for a code from your email on every new sign-in."
                  >
                    <Switch
                      checked={settings.twoFactor}
                      onCheckedChange={(checked) =>
                        updateSettings({ twoFactor: checked })
                      }
                    />
                  </SettingRow>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {section === "notifications" ? (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Choose what reaches you, and where.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="hidden items-center justify-end gap-8 pb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase sm:flex">
                  <span className="w-16 text-center">In-app</span>
                  <span className="w-16 text-center">Email</span>
                </div>
                <div className="flex flex-col divide-y">
                  {NOTIFICATION_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-8">
                        <div className="flex w-16 justify-center">
                          <Switch
                            aria-label={`${item.title} in-app`}
                            checked={settings.notifications[item.key].inApp}
                            onCheckedChange={(checked) =>
                              setNotification(item.key, "inApp", checked)
                            }
                          />
                        </div>
                        <div className="flex w-16 justify-center">
                          <Switch
                            aria-label={`${item.title} email`}
                            checked={settings.notifications[item.key].email}
                            onCheckedChange={(checked) =>
                              setNotification(item.key, "email", checked)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {section === "general" ? (
            <Card>
              <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>
                  Language, region and how figures are shown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="language">Language</FieldLabel>
                      <Select
                        items={LANGUAGE_OPTIONS}
                        value={settings.language}
                        onValueChange={(value) =>
                          updateSettings({ language: value as string })
                        }
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {LANGUAGE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="tz">Timezone</FieldLabel>
                      <Select
                        items={TIMEZONE_OPTIONS.map((zone) => ({
                          value: zone,
                          label: zone,
                        }))}
                        value={settings.timezone}
                        onValueChange={(value) =>
                          updateSettings({ timezone: value as string })
                        }
                      >
                        <SelectTrigger id="tz">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {TIMEZONE_OPTIONS.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="time-format">Time format</FieldLabel>
                      <ToggleGroup
                        id="time-format"
                        variant="outline"
                        value={[settings.timeFormat]}
                        onValueChange={(value: string[]) => {
                          if (value[0]) {
                            updateSettings({
                              timeFormat: value[0] as TimeFormat,
                            })
                          }
                        }}
                      >
                        <ToggleGroupItem value="12h">12-hour</ToggleGroupItem>
                        <ToggleGroupItem value="24h">24-hour</ToggleGroupItem>
                      </ToggleGroup>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="currency">
                        Display currency
                      </FieldLabel>
                      <Select
                        items={CURRENCY_OPTIONS}
                        value={settings.displayCurrency}
                        onValueChange={(value) =>
                          updateSettings({ displayCurrency: value as Currency })
                        }
                      >
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {CURRENCY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Every amount across Artha is shown in this currency —
                        e.g. {formatMoney(1000, "USD")}.
                      </p>
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          ) : null}

          {section === "appearance" ? (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Match your system, or pick a side.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mounted ? (
                  <ToggleGroup
                    variant="outline"
                    value={[theme ?? "system"]}
                    onValueChange={(value: string[]) => {
                      if (value[0]) setTheme(value[0])
                    }}
                  >
                    <ToggleGroupItem value="system">
                      <Monitor data-icon="inline-start" />
                      System
                    </ToggleGroupItem>
                    <ToggleGroupItem value="light">
                      <Sun data-icon="inline-start" />
                      Light
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dark">
                      <Moon data-icon="inline-start" />
                      Dark
                    </ToggleGroupItem>
                  </ToggleGroup>
                ) : (
                  <div className="h-9" />
                )}
              </CardContent>
            </Card>
          ) : null}

          {section === "danger" ? (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="size-4" />
                  Danger zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions. Please read carefully.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingRow
                  title="Delete account"
                  description="Removes your profile, entries, goals and sources permanently."
                >
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete account
                  </Button>
                </SettingRow>
              </CardContent>
            </Card>
          ) : null}

          {section === "feedback" ? (
            <Card>
              <CardHeader>
                <CardTitle>Send feedback</CardTitle>
                <CardDescription>
                  Tell us what to build next, or what got in your way.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {feedbackSent ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm duration-300 animate-in fade-in-0 zoom-in-95">
                    <BadgeCheck className="size-4 shrink-0 text-success" />
                    Thanks — that has been noted. We read every message.
                  </div>
                ) : null}

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="topic">What is this about?</FieldLabel>
                    <Select
                      items={FEEDBACK_TOPICS}
                      value={feedbackTopic}
                      onValueChange={(value) =>
                        setFeedbackTopic(value as string)
                      }
                    >
                      <SelectTrigger id="topic">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {FEEDBACK_TOPICS.map((topic) => (
                            <SelectItem key={topic.value} value={topic.value}>
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="feedback">Your message</FieldLabel>
                    <Textarea
                      id="feedback"
                      rows={6}
                      placeholder="The more specific, the more useful."
                      value={feedbackText}
                      onChange={(event) => {
                        setFeedbackText(event.target.value)
                        setFeedbackSent(false)
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll reply to {profile.email} if a response is
                      needed.
                    </p>
                  </Field>
                </FieldGroup>

                <Button
                  className="w-fit"
                  disabled={feedbackText.trim().length < 5}
                  onClick={() => {
                    setFeedbackText("")
                    setFeedbackSent(true)
                  }}
                >
                  <Send data-icon="inline-start" />
                  Send feedback
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {section === "help" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Help &amp; support</CardTitle>
                  <CardDescription>
                    Answers to the questions that come up most.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion defaultValue={[FAQS[0].q]}>
                    {FAQS.map((faq) => (
                      <AccordionItem key={faq.q} value={faq.q}>
                        <AccordionTrigger>{faq.q}</AccordionTrigger>
                        <AccordionContent>{faq.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Still stuck?</CardTitle>
                  <CardDescription>
                    Send us the details and we&apos;ll take a look.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSection("feedback")}
                  >
                    <MessageSquare data-icon="inline-start" />
                    Contact support
                  </Button>
                  <Button variant="ghost" onClick={() => router.push("/reports")}>
                    <Download data-icon="inline-start" />
                    Export my data
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}

          {section === "about" ? (
            <Card>
              <CardHeader>
                <CardTitle>About {SITE.name}</CardTitle>
                <CardDescription>{SITE.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <Image
                    src={SITE.logoPath}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 rounded-2xl object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold tracking-[0.15em]">
                      {SITE.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Version 0.1 · Design preview
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Artha brings your crypto, stocks and cash income into one
                  place. Everything is entered by hand on purpose — no exchange
                  logins, no read-only API keys, no third party holding your
                  keys. You decide what gets recorded, and your figures stay
                  yours.
                </p>

                <div className="flex flex-col divide-y">
                  {[
                    { label: "Entry method", value: "Manual only" },
                    { label: "Currencies", value: "USD, NPR, INR, EUR, GBP, AED" },
                    { label: "Exports", value: "PDF, CSV, JSON" },
                    { label: "Data location", value: "This browser, for now" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="text-sm font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* --------------------------------------------------- Password flow */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {settings.hasPassword ? "Change password" : "Add a password"}
            </DialogTitle>
            <DialogDescription>
              {settings.hasPassword
                ? "Pick a new password for your account."
                : `We'll email a code to ${profile.email} to confirm it is you.`}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            {settings.hasPassword ? (
              <Field>
                <FieldLabel htmlFor="current-password">
                  Current password
                </FieldLabel>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </Field>
            ) : null}
            <Field data-invalid={passwordTooShort ? true : undefined}>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                aria-invalid={passwordTooShort ? true : undefined}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              {passwordTooShort ? (
                <p className="text-sm text-destructive">
                  Use at least 8 characters.
                </p>
              ) : null}
            </Field>
            <Field data-invalid={passwordMismatch ? true : undefined}>
              <FieldLabel htmlFor="confirm-password">
                Confirm password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                aria-invalid={passwordMismatch ? true : undefined}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {passwordMismatch ? (
                <p className="text-sm text-destructive">
                  Those two don&apos;t match.
                </p>
              ) : null}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmitPassword}
              onClick={() => {
                setPasswordOpen(false)
                startOtp("password")
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------ Email flow */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change email address</DialogTitle>
            <DialogDescription>
              We&apos;ll send a code to your current address to confirm the
              change.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-email">New email</FieldLabel>
              <Input
                id="new-email"
                type="email"
                placeholder="you@example.com"
                value={pendingEmail}
                onChange={(event) => setPendingEmail(event.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!pendingEmail.includes("@")}
              onClick={() => {
                setEmailOpen(false)
                startOtp("email")
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------- Delete flow */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-destructive" />
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This removes your profile, every entry, goal and source. It cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 rounded-2xl border p-4">
            <p className="text-sm font-medium">Download your data first</p>
            <p className="text-sm text-muted-foreground">
              Take a full export while you still can. This opens Reports with
              everything, all time, ready to download.
            </p>
            <Button
              variant="outline"
              className="w-fit"
              onClick={() => router.push("/reports?scope=all&range=all")}
            >
              <Download data-icon="inline-start" />
              Export all my data
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            To continue, we&apos;ll email a confirmation code to{" "}
            <span className="font-medium">{profile.email}</span>.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Keep my account
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false)
                startOtp("delete")
              }}
            >
              Continue to delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OtpDialog
        open={otpFlow !== null}
        onOpenChange={(open) => {
          if (!open) setOtpFlow(null)
        }}
        email={profile.email}
        code={otpCode}
        destructive={otpFlow === "delete"}
        title={
          otpFlow === "delete"
            ? "Confirm account deletion"
            : otpFlow === "email"
              ? "Confirm your new email"
              : "Confirm your password"
        }
        description={
          otpFlow === "delete"
            ? "This is the last step. Enter the code to delete your account."
            : "Enter the code we sent to finish."
        }
        confirmLabel={otpFlow === "delete" ? "Delete account" : "Confirm"}
        onResend={() => setOtpCode(generateOtp())}
        onVerified={() => {
          if (otpFlow === "password") {
            updateSettings({ hasPassword: true, loginMethod: "password" })
            setNotice("Password added. You can now sign in with either method.")
          } else if (otpFlow === "email") {
            saveProfile({ ...profile, email: pendingEmail })
            setNotice(`Email changed to ${pendingEmail}.`)
          } else if (otpFlow === "delete") {
            setNotice(
              "Account deletion confirmed. Wiring this to a backend comes later."
            )
          }
          setOtpFlow(null)
        }}
      />
    </AppShell>
  )
}
