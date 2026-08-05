"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  AtSign,
  Briefcase,
  CircleDot,
  Globe,
  Link2,
  MessageCircle,
  type LucideIcon,
} from "lucide-react"

import { getAvatarPreset, PresetAvatar } from "@/components/profile/avatar-presets"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { UserProfile } from "@/lib/types"
import { cn } from "@/lib/utils"

// lucide v1 dropped brand icons, so platforms map onto generic ones. The real
// platform name still shows in the tooltip.
const PLATFORM_ICONS: [RegExp, LucideIcon][] = [
  [/^x$|twitter/i, AtSign],
  [/github|gitlab/i, CircleDot],
  [/linkedin/i, Briefcase],
  [/telegram|discord|whatsapp|reddit|signal/i, MessageCircle],
  [/site|web|blog|portfolio/i, Globe],
]

function iconFor(platform: string): LucideIcon {
  for (const [pattern, icon] of PLATFORM_ICONS) {
    if (pattern.test(platform)) return icon
  }
  return Link2
}

function SocialButton({
  platform,
  url,
}: {
  platform: string
  url: string
}) {
  const label = platform.trim() || "Link"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={url || "#"}
            target={url ? "_blank" : undefined}
            rel={url ? "noreferrer" : undefined}
            aria-label={label}
            className="group flex size-11 items-center justify-center rounded-full bg-secondary/50 transition-all duration-300 ease-out hover:scale-105 hover:bg-secondary"
          />
        }
      >
        {/* createElement rather than a capitalised local: the icon is being
            selected from a fixed set, not defined here. */}
        {React.createElement(iconFor(platform), {
          className:
            "size-5 text-secondary-foreground/70 transition-colors duration-200 group-hover:text-secondary-foreground",
        })}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

function CardAction({
  label,
  onClick,
  variant,
}: {
  label: string
  onClick: () => void
  variant: "primary" | "secondary"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold",
        "transition-all duration-300 ease-out hover:scale-[1.03] active:scale-95",
        variant === "primary"
          ? "bg-primary text-primary-foreground shadow-lg"
          : "border bg-secondary/50 text-secondary-foreground hover:bg-secondary"
      )}
    >
      <span>{label}</span>
      <ArrowUpRight className="size-4 transition-transform duration-300 ease-out group-hover:rotate-45" />
    </button>
  )
}

/**
 * Glassmorphism profile card. Reads the signed-in profile and offers the two
 * places you'd want to go next.
 */
export function ProfileCard({
  profile,
  onNavigate,
}: {
  profile: UserProfile
  onNavigate?: () => void
}) {
  const router = useRouter()

  function go(href: string) {
    onNavigate?.()
    router.push(href)
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative flex flex-col items-center rounded-3xl border bg-card/60 p-7 shadow-xl backdrop-blur-xl transition-all duration-500 ease-out">
        <div className="mb-4 size-24 rounded-full border-2 border-border/60 p-1">
          {profile.avatarUrl ? (
            // Data URL from the local file picker, so next/image adds nothing
            // but configuration.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              className="size-full rounded-full object-cover"
            />
          ) : (
            <PresetAvatar
              preset={getAvatarPreset(profile.avatarId)}
              className="size-full rounded-full"
            />
          )}
        </div>

        <h2 className="text-2xl font-bold text-card-foreground">
          {profile.name || "Your name"}
        </h2>
        <p className="mt-1 text-sm font-medium text-primary">
          @{profile.username || "username"}
        </p>
        {profile.bio ? (
          <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        ) : null}

        {profile.socials.length > 0 || profile.website ? (
          <>
            <div className="my-6 h-px w-1/2 rounded-full bg-border" />
            <div className="flex items-center justify-center gap-3">
              {profile.website ? (
                <SocialButton platform="Website" url={profile.website} />
              ) : null}
              {profile.socials.map((link) => (
                <SocialButton
                  key={link.id}
                  platform={link.platform}
                  url={link.url}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="my-6 h-px w-1/2 rounded-full bg-border" />
        )}

        <div className="mt-6 flex w-full items-center gap-2">
          <CardAction
            label="Profile"
            variant="primary"
            onClick={() => go("/profile")}
          />
          <CardAction
            label="Settings"
            variant="secondary"
            onClick={() => go("/settings")}
          />
        </div>
      </div>

      {/* Soft glow, coloured from the theme's chart palette. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-chart-1/50 to-chart-3/50 opacity-30 blur-2xl transition-all duration-500 ease-out"
      />
    </div>
  )
}
