"use client"

// The way around the app on a phone.
//
// The sidebar is `hidden md:flex`, so below 768px it is not merely collapsed —
// it is not rendered at all, and the header's "Show sidebar" button only
// appears when someone has chosen to hide it. A phone had no navigation of any
// kind: you could reach a page and then only leave it by the breadcrumb or by
// search. This is the missing door.
//
// It reads NAV_SECTIONS, the same list the sidebar renders and the breadcrumb
// and search read, so a page added there appears here without anyone
// remembering to come back.

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "@/components/icons"

import { ArthaMark } from "@/components/layout/artha-mark"
import { NavIcon } from "@/components/layout/nav-icon"
import { NavIconButton } from "@/components/layout/nav-icon-button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NAV_SECTIONS } from "@/lib/nav-config"
import { SITE } from "@/lib/site"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <NavIconButton label="Open menu" className="md:hidden">
            <Menu />
          </NavIconButton>
        }
      />
      <SheetContent side="left" className="w-72 gap-0 p-0 sm:max-w-72">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Move between the pages of {SITE.name}.
        </SheetDescription>

        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-5">
          <ArthaMark className="size-7" />
          <span className="text-base font-semibold tracking-[0.14em]">
            {SITE.name.toUpperCase()}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-5 last:mb-0">
              <p className="px-2 pb-1.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {section.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        // Closing on the tap is the whole contract of a
                        // drawer: one left standing open over the page it just
                        // opened looks like the tap did nothing.
                        onClick={() => setOpen(false)}
                        // Roomy rows on purpose. This is a thumb target, not a
                        // pointer target.
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-accent font-medium text-foreground"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        )}
                      >
                        <NavIcon icon={item.icon} className="size-[18px]" />
                        {item.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
