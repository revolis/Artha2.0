"use client"

import { Eye } from "lucide-react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { ThemeToggler } from "@/components/layout/theme-toggler"
import { Button } from "@/components/ui/button"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Shared page frame: sidebar + top header. Every app page renders inside this.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
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
      </SidebarInset>
    </SidebarProvider>
  )
}
