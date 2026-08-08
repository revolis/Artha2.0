"use client"

import * as React from "react"
import Link from "next/link"

import { ArthaMark } from "@/components/layout/artha-mark"
import { ThemeToggler } from "@/components/layout/theme-toggler"
import { Button } from "@/components/ui/button"
import { MagnetizeButton } from "@/components/ui/magnetize-button"
import TextRoll from "@/components/ui/text-roll"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#pages", label: "Workspace" },
  { href: "#how", label: "Method" },
  { href: "#faq", label: "FAQ" },
]

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <ArthaMark className="size-7" />
          <span className="text-base font-semibold tracking-[0.14em]">
            ARTHA
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {/* Each letter rolls to its duplicate on hover. */}
              <TextRoll>{section.label}</TextRoll>
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggler />
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            render={<Link href="/dashboard" />}
            nativeButton={false}
          >
            Live demo
          </Button>
          {/* Log in only. Signing up is the page's closing ask, not something
              to press before reading anything. */}
          <MagnetizeButton
            size="sm"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            Log in
          </MagnetizeButton>
        </div>
      </nav>
    </header>
  )
}
