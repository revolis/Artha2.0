"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeftRight,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  FileText,
  Layers,
  LayoutDashboard,
  LineChart,
  Settings,
  Sparkles,
  Target,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Entries", href: "/entries", icon: ArrowUpDown },
  { title: "P2P Cash", href: "#", icon: ArrowLeftRight },
  { title: "Portfolio", href: "#", icon: LineChart },
  { title: "Analytics", href: "#", icon: BarChart3 },
  { title: "Year Heatmap", href: "#", icon: CalendarDays },
  { title: "Goals", href: "/goals", icon: Target },
  { title: "Reports", href: "#", icon: FileText },
  { title: "Sources", href: "#", icon: Layers },
  { title: "AI Insights", href: "#", icon: Sparkles },
  { title: "Settings", href: "#", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            A
          </div>
          <span className="text-xs font-semibold tracking-[0.2em] text-sidebar-foreground">
            ARTHA
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={item.href !== "#" && pathname.startsWith(item.href)}
                render={<Link href={item.href} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
