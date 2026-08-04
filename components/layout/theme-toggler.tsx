"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// next-themes owns the theme, so the toggler runs controlled — left
// uncontrolled it writes its own localStorage key and fights the provider.

const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function ThemeToggler({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const triggerClass = cn(
    buttonVariants({ variant: "ghost", size: "icon-sm" }),
    className
  )

  // Until next-themes resolves on the client, render a placeholder of the
  // same size so the header does not shift.
  if (!mounted) {
    return <div className={triggerClass} aria-hidden />
  }

  return (
    <AnimatedThemeToggler
      className={triggerClass}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={setTheme}
      variant="circle"
      duration={450}
    />
  )
}
