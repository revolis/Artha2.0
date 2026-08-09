"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  TriangleAlert,
  Bug,
  Clock,
  Lightbulb,
  LifeBuoy,
  Mail,
  Send,
  ShieldAlert,
} from "@/components/icons"

import { AppShell } from "@/components/layout/app-shell"
import { ContactChannels } from "@/components/layout/contact-channels"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useProfile } from "@/lib/use-profile"
import { cn } from "@/lib/utils"

const TOPICS = [
  { value: "bug", label: "Something is broken", icon: Bug },
  { value: "idea", label: "I have an idea", icon: Lightbulb },
  { value: "help", label: "I need help using Artha", icon: LifeBuoy },
  { value: "security", label: "A security concern", icon: ShieldAlert },
  { value: "other", label: "Something else", icon: Mail },
]

export function ContactPage() {
  const router = useRouter()
  const { profile } = useProfile()

  const [topic, setTopic] = React.useState("help")
  const [replyTo, setReplyTo] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [sent, setSent] = React.useState(false)

  // The signed-in address arrives from the database a moment after this form
  // mounts, so it is filled in when it lands. Once the visitor has typed an
  // address of their own, it is theirs and nothing overwrites it.
  const typedOwnAddress = React.useRef(false)
  React.useEffect(() => {
    if (!typedOwnAddress.current && profile.email) setReplyTo(profile.email)
  }, [profile.email])

  const canSend = message.trim().length >= 10 && replyTo.includes("@")
  const selected = TOPICS.find((item) => item.value === topic)

  return (
    <AppShell>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Support
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Contact Us</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Write a message</CardTitle>
            <CardDescription>
              The more detail you give, the sooner it is resolved.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Not the success treatment: a green tick over the words "Not
                delivered yet" reads as though it went through. */}
            {sent ? (
              <div className="flex animate-in items-start gap-2 rounded-2xl border border-dashed bg-muted/40 p-4 text-sm duration-300 fade-in-0 zoom-in-95">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Not delivered yet</span>
                  <span className="text-muted-foreground">
                    This form is waiting on the backend, so nothing has actually
                    been sent. Use email or Telegram and it will reach me today.
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {TOPICS.map((item) => {
                const active = item.value === topic
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setTopic(item.value)
                      setSent(false)
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-3.5" />
                    {item.label}
                  </button>
                )
              })}
            </div>

            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="reply-to">Reply to</FieldLabel>
                  <Input
                    id="reply-to"
                    type="email"
                    value={replyTo}
                    onChange={(event) => {
                      typedOwnAddress.current = true
                      setReplyTo(event.target.value)
                    }}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="topic">Topic</FieldLabel>
                  <Select
                    items={TOPICS.map((item) => ({
                      value: item.value,
                      label: item.label,
                    }))}
                    value={topic}
                    onValueChange={(value) => setTopic(value as string)}
                  >
                    <SelectTrigger id="topic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TOPICS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="subject">Subject</FieldLabel>
                <Input
                  id="subject"
                  placeholder={
                    selected ? `${selected.label}…` : "A short summary"
                  }
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="message">Message</FieldLabel>
                <Textarea
                  id="message"
                  rows={8}
                  placeholder={
                    topic === "bug"
                      ? "What did you do, what did you expect, and what happened instead?"
                      : "Tell us what's on your mind."
                  }
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value)
                    setSent(false)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {message.trim().length < 10
                    ? "A little more detail, please."
                    : "Ready to send."}
                </p>
              </Field>
            </FieldGroup>

            <Button
              className="w-fit"
              disabled={!canSend}
              onClick={() => {
                setMessage("")
                setSubject("")
                setSent(true)
              }}
            >
              <Send data-icon="inline-start" />
              Send message
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Reach me directly</CardTitle>
              <CardDescription>
                All three arrive with the same person.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ContactChannels className="sm:grid-cols-1" />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/help")}
              >
                <LifeBuoy data-icon="inline-start" />
                Check the Help Centre first
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4" />
                Response time
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Artha is built and maintained by one person, so replies are
                written rather than automated — usually within a couple of days.
                Telegram is the fastest of the three. Anything touching security
                is answered first.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If something is behaving badly, naming the page you were on and
                what you had just done saves an exchange of messages.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
