"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { NavIcon } from "@/components/layout/nav-icon"
import { findNavLocation } from "@/lib/nav-config"

/**
 * Shows where in the app the user currently is: Home → section → page,
 * read out of the shared nav config so it never drifts from the sidebar.
 */
export function NavBreadcrumb() {
  const pathname = usePathname()
  const location = findNavLocation(pathname)

  const onHome = pathname === "/dashboard"

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-1.5 sm:gap-2">
        <BreadcrumbItem>
          {onHome ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Home</span>
            </span>
          ) : (
            <BreadcrumbLink
              render={<Link href="/dashboard" />}
              className="flex items-center gap-1.5"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Home</span>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {location ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:inline-flex">
              <span className="text-muted-foreground">
                {location.section.title}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:inline-flex" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="flex min-w-0 items-center gap-1.5 font-medium">
                <span className="size-3.5 shrink-0 text-muted-foreground">
                  <NavIcon icon={location.item.icon} />
                </span>
                <span className="truncate">{location.item.title}</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
