"use client"

import * as React from "react"
import { PanelLeft } from "@/components/icons"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { NavBreadcrumb } from "@/components/layout/nav-breadcrumb"
import {
  navIconClass,
  NavIconButton,
} from "@/components/layout/nav-icon-button"
import { CurrencySwitcher } from "@/components/layout/currency-switcher"
import { MobileNav } from "@/components/layout/mobile-nav"
import { NavSearch } from "@/components/layout/nav-search"
import { NotificationsMenu } from "@/components/layout/notifications-menu"
import { PrivacyToggle } from "@/components/layout/privacy-toggle"
import { ThemeToggler } from "@/components/layout/theme-toggler"
import { DemoBanner } from "@/components/layout/demo-banner"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { ProfileCard } from "@/components/profile/profile-card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useProfile } from "@/lib/use-profile"
import { useSidebarMode } from "@/lib/use-sidebar-mode"
import { cn } from "@/lib/utils"

const emptySubscribe = () => () => {}

/**
 * The stored profile and sidebar mode are only known on the client, so the
 * header waits for mount before rendering anything that depends on them.
 */
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/70 px-4 backdrop-blur-xl md:px-6">
          {/* Below md the sidebar is not rendered at all, so this is the only
              way between pages on a phone. Above md the sidebar is there and
              this disappears. */}
          <MobileNav />

          {/* The desktop equivalent, and only when the sidebar has been put
              away on purpose. */}
          {mode === "hidden" ? (
            <NavIconButton
              label="Show sidebar"
              className="hidden md:inline-flex"
              onClick={() => setMode("open")}
            >
              <PanelLeft />
            </NavIconButton>
          ) : null}

          <div aria-hidden className="h-5 w-px bg-border md:hidden" />
          {mode === "hidden" ? (
            <div aria-hidden className="hidden h-5 w-px bg-border md:block" />
          ) : null}

          {/* Where you are, rather than a fixed page title. */}
          <NavBreadcrumb />

          <div className="ml-auto flex items-center gap-1">
            <NavSearch />
            {/* Directly after search, as the currency is a way of reading the
                page rather than a setting to go and find. */}
            <CurrencySwitcher />
            <NotificationsMenu />
            <PrivacyToggle />
            <ThemeToggler className={navIconClass} />

            <div aria-hidden className="mx-1 h-5 w-px bg-border" />

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
                      className={cn(
                        "rounded-full ring-offset-background outline-none",
                        "transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 active:scale-95",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "data-popup-open:ring-2 data-popup-open:ring-ring data-popup-open:ring-offset-2"
                      )}
                    />
                  }
                >
                  <ProfileAvatar
                    avatarPath={profile.avatarPath}
                    avatarId={profile.avatarId}
                    className="size-9 rounded-full"
                  />
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

        <DemoBanner />

        <div className="flex flex-col gap-6 p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
