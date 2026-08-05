"use client"

import { useRouter } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import {
  getAvatarPreset,
  PresetAvatar,
} from "@/components/profile/avatar-presets"
import { SocialIcon, socialLabel } from "@/components/profile/social-icons"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { UserProfile } from "@/lib/types"
import { cn } from "@/lib/utils"

function SocialButton({ platform, url }: { platform: string; url: string }) {
  const label = socialLabel(platform)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={url || "#"}
            target={url ? "_blank" : undefined}
            rel={url ? "noreferrer" : undefined}
            aria-label={label}
            className="group flex size-8 items-center justify-center rounded-lg bg-secondary/60 text-secondary-foreground/70 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-secondary hover:text-foreground"
          />
        }
      >
        <SocialIcon
          platform={platform}
          className="size-4 transition-transform duration-300 ease-out group-hover:scale-110"
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
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
        "group flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold",
        "transition-all duration-300 ease-out active:scale-95",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border bg-secondary/50 text-secondary-foreground hover:bg-secondary"
      )}
    >
      <span>{label}</span>
      <ArrowUpRight className="size-3.5 transition-transform duration-300 ease-out group-hover:rotate-45" />
    </button>
  )
}

/**
 * Compact glassmorphism profile card shown from the header avatar: who you're
 * signed in as, your links, and the two places you'd want to go next.
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

  const hasLinks = profile.socials.length > 0 || Boolean(profile.website)

  return (
    <div className="relative w-64">
      <div className="relative flex flex-col gap-3 rounded-2xl border bg-card/70 p-4 shadow-xl backdrop-blur-xl">
        {/* Avatar beside the name rather than above it — half the height. */}
        <div className="flex items-center gap-3">
          <div className="size-11 shrink-0 rounded-full border border-border/60 p-0.5">
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
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-card-foreground">
              {profile.name || "Your name"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              @{profile.username || "username"}
            </span>
          </div>
        </div>

        {profile.bio ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        ) : null}

        {hasLinks ? (
          <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
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
        ) : null}

        <div className="flex items-center gap-1.5">
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
        className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-chart-1/50 to-chart-3/50 opacity-25 blur-2xl"
      />
    </div>
  )
}
