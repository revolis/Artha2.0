// One list of every page in the app. The sidebar renders it, the header
// breadcrumb reads the current page out of it, and the navbar search matches
// against it — so a page only has to be added here once.

import {
  ArrowLeftRight,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  CreditCard,
  FileText,
  HelpCircle,
  Info,
  LayoutDashboard,
  LineChart,
  Mail,
  Settings,
  Target,
  User,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Entries", href: "/entries", icon: ArrowUpDown },
      { title: "Fiat/P2P", href: "/p2p", icon: ArrowLeftRight },
      { title: "Portfolio", href: "/portfolio", icon: LineChart },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Planning",
    items: [
      { title: "Goals", href: "/goals", icon: Target },
      { title: "Year Heatmap", href: "/heatmap", icon: CalendarDays },
      { title: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", href: "/profile", icon: User },
      { title: "Billing", href: "/billing", icon: CreditCard },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
  {
    title: "Support",
    items: [
      { title: "Help Centre", href: "/help", icon: HelpCircle },
      { title: "Contact Us", href: "/contact", icon: Mail },
      { title: "About Us", href: "/about", icon: Info },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(
  (section) => section.items
)

/** Which section and page the given path belongs to, if any. */
export function findNavLocation(
  pathname: string
): { section: NavSection; item: NavItem } | null {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return { section, item }
      }
    }
  }
  return null
}
