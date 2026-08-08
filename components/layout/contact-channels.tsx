import { ArrowUpRight } from "@/components/icons"
import { SocialIcon } from "@/components/profile/social-icons"
import { CONTACT, mailtoLink } from "@/lib/contact"
import { cn } from "@/lib/utils"

interface Channel {
  platform: string
  label: string
  value: string
  href: string
  note: string
}

const CHANNELS: Channel[] = [
  {
    platform: "gmail",
    label: "Email",
    value: CONTACT.email,
    href: mailtoLink("Artha"),
    note: "Best for anything detailed, or with a screenshot attached.",
  },
  {
    platform: "telegram",
    label: "Telegram",
    value: CONTACT.telegram.handle,
    href: CONTACT.telegram.url,
    note: "Quickest reply. Good for a short question.",
  },
  {
    platform: "x",
    label: "X",
    value: CONTACT.x.handle,
    href: CONTACT.x.url,
    note: "Release notes and what is being worked on next.",
  },
]

/** The three ways to make contact, with each network's own mark. */
export function ContactChannels({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {CHANNELS.map((channel) => {
        const external = !channel.href.startsWith("mailto:")
        return (
          <a
            key={channel.label}
            href={channel.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer noopener" : undefined}
            className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20"
          >
            <span className="flex items-center gap-2">
              <SocialIcon
                platform={channel.platform}
                className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
              />
              <span className="text-sm font-medium">{channel.label}</span>
              <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <span className="truncate text-sm text-muted-foreground">
              {channel.value}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground/80">
              {channel.note}
            </span>
          </a>
        )
      })}
    </div>
  )
}
