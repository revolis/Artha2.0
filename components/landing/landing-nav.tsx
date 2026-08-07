"use client"

import * as React from "react"
import Link from "next/link"

import { ArrowRight } from "@/components/icons"
import { ArthaMark } from "@/components/layout/artha-mark"
import { ThemeToggler } from "@/components/layout/theme-toggler"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { href: "#preview", label: "Live preview" },
  { href: "#features", label: "Features" },
  { href: "#pages", label: "Pages" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
]

export function LandingNav() {
  // Only the scrolled state changes, so a scroll listener is enough — no need
  // for an observer here.
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

        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggler />
          <Button
            size="sm"
            render={<Link href="/dashboard" />}
            nativeButton={false}
          >
            Live Demo
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </nav>
    </header>
  )
}
