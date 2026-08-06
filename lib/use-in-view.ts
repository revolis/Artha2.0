"use client"

import * as React from "react"

/**
 * True once the element has been scrolled into view, and stays true — reveal
 * animations shouldn't replay every time something scrolls past.
 *
 * IntersectionObserver does the work where it's available, but a plain
 * scroll/resize check backs it up: some environments never fire the observer,
 * and a section that silently stays invisible is far worse than one that
 * reveals a little early.
 */
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  { rootMargin = "-10%" }: { rootMargin?: string } = {}
) {
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element || inView) return

    let done = false
    const reveal = () => {
      if (done) return
      done = true
      setInView(true)
    }

    // Already on screen when mounted (short pages, or a direct link).
    const check = () => {
      const rect = element.getBoundingClientRect()
      const height = window.innerHeight || document.documentElement.clientHeight
      if (rect.top < height * 0.9 && rect.bottom > 0) reveal()
    }

    check()
    if (done) return

    let observer: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) reveal()
        },
        { rootMargin }
      )
      observer.observe(element)
    }

    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    // Last resort for environments where neither the observer nor scroll
    // events arrive. Long enough that scrolling normally wins the race, short
    // enough that nobody is left looking at blank tiles.
    const timer = window.setTimeout(reveal, 6000)

    return () => {
      observer?.disconnect()
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
      window.clearTimeout(timer)
    }
  }, [ref, rootMargin, inView])

  return inView
}
