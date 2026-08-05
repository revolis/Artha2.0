"use client"

import * as React from "react"
import { Eye, PanelLeft } from "lucide-react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { ThemeToggler } from "@/components/layout/theme-toggler"
import { Button } from "@/components/ui/button"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebarMode } from "@/lib/use-sidebar-mode"

// Shared page frame: sidebar + top header. Every app page renders inside this.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useSidebarMode()
  const [hovering, setHovering] = React.useState(false)

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
            <InteractiveHoverButton className="px-4 py-1.5">
              Sign Out
            </InteractiveHoverButton>
          </div>
        </header>

        <div className="flex flex-col gap-6 p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
