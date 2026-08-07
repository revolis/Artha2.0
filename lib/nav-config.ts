// One list of every page in the app. The sidebar renders it, the header
// breadcrumb reads the current page out of it, and the navbar search matches
// against it — so a page only has to be added here once.

import {
  Analytics01Icon,
  ArrowDataTransferVerticalIcon,
  Calendar03Icon,
  ChartLineData01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  ExchangeDollarIcon,
  File01Icon,
  HelpCircleIcon,
  InformationCircleIcon,
  Mail01Icon,
  Settings02Icon,
  Target01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

export interface NavItem {
  title: string
  href: string
  icon: IconSvgElement
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: DashboardSquare01Icon },
      {
        title: "Entries",
        href: "/entries",
        icon: ArrowDataTransferVerticalIcon,
      },
      { title: "Fiat/P2P", href: "/p2p", icon: ExchangeDollarIcon },
      { title: "Portfolio", href: "/portfolio", icon: ChartLineData01Icon },
      { title: "Analytics", href: "/analytics", icon: Analytics01Icon },
    ],
  },
  {
    title: "Planning",
    items: [
      { title: "Goals", href: "/goals", icon: Target01Icon },
      { title: "Year Heatmap", href: "/heatmap", icon: Calendar03Icon },
      { title: "Reports", href: "/reports", icon: File01Icon },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", href: "/profile", icon: UserCircleIcon },
      { title: "Billing", href: "/billing", icon: CreditCardIcon },
      { title: "Settings", href: "/settings", icon: Settings02Icon },
    ],
  },
  {
    // Rendered as a single row of icons at the foot of the sidebar.
    title: "Support",
    items: [
      { title: "Help Centre", href: "/help", icon: HelpCircleIcon },
      { title: "Contact Us", href: "/contact", icon: Mail01Icon },
      { title: "About Us", href: "/about", icon: InformationCircleIcon },
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
