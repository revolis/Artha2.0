"use client"

import * as React from "react"
import { Eye, PanelLeft } from "lucide-react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { ThemeToggler } from "@/components/layout/theme-toggler"
import { getAvatarPreset, PresetAvatar } from "@/components/profile/avatar-presets"
import { ProfileCard } from "@/components/profile/profile-card"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useProfile } from "@/lib/use-profile"
import { useSidebarMode } from "@/lib/use-sidebar-mode"

const emptySubscribe = () => () => {}

/**
 * The stored profile and sidebar mode are only known on the client, so the
 * header waits for mount before rendering anything that depends on them.
 */
function useMounted() {
  return React.useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// Shared page frame: sidebar + top header. Every app page renders inside this.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useSidebarMode()
  const { profile } = useProfile()
  const mounted = useMounted()
  const [hovering, setHovering] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)

  const expanded = mode === "open" || (mode === "hover" && hovering)

  return (
    <div className="flex min-h-svh w-full">
      {mode !== "hidden" ? (
        <AppSidebar
          mode={mode}
          onModeChange={setMode}
          expanded={expanded}
          onHoverChange={setHovering}
        />
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          {mode === "hidden" ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Show sidebar"
                    onClick={() => setMode("open")}
                  />
                }
              >
                <PanelLeft />
              </TooltipTrigger>
              <TooltipContent side="bottom">Show sidebar</TooltipContent>
            </Tooltip>
          ) : null}

          <div className="flex flex-col">
            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Artha Mgmt
            </span>
            <span className="text-sm font-semibold">Financial Overview</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggler />
            <Button variant="ghost" size="icon-sm" aria-label="Privacy mode">
              <Eye />
            </Button>
            {/* The avatar opens the profile card, which carries the Profile
                and Settings actions. */}
            {!mounted ? (
              <div className="size-9 rounded-full bg-muted" aria-hidden />
            ) : (
            <Popover open={profileOpen} onOpenChange={setProfileOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label="Open profile"
                    className="rounded-full ring-offset-2 ring-offset-background transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:ring-2 data-popup-open:ring-ring"
                  />
                }
              >
                {profile.avatarUrl ? (
                  // Data URL from the local file picker.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <PresetAvatar
                    preset={getAvatarPreset(profile.avatarId)}
                    className="size-9 rounded-full"
                  />
                )}
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-auto border-none bg-transparent p-0 shadow-none"
              >
                <ProfileCard
                  profile={profile}
                  onNavigate={() => setProfileOpen(false)}
                />
              </PopoverContent>
            </Popover>
            )}
          </div>
        </header>

        <div className="flex flex-col gap-6 p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
