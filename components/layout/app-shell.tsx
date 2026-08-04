"use client"

import { Eye, LogOut } from "lucide-react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
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
            <Button variant="ghost" size="icon-sm" aria-label="Privacy mode">
              <Eye />
            </Button>
            <Button variant="outline" size="sm">
              <LogOut data-icon="inline-start" />
              Sign Out
            </Button>
          </div>
        </header>
        <div className="flex flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
