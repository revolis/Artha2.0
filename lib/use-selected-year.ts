"use client"

// The year every page is looking at.
//
// This used to be `useState(currentYear)` in each page, which meant the year
// was a property of the page rather than of what you were doing: switching to
// 2025 on the dashboard and clicking Entries put you back in 2026, and a
// refresh did the same. It is one value now, shared by every page that shows a
// year, and mirrored into the address bar so it survives a reload and can be
// linked to.
//
// The URL is read and written through the History API rather than
// useSearchParams. That hook needs a Suspense boundary, and wrapping a whole
// page in one is what stopped two pages hydrating at all once before.

import * as React from "react"

const CURRENT_YEAR = new Date().getFullYear()
const PARAM = "year"

let cache = CURRENT_YEAR
let readUrlYet = false
const listeners = new Set<() => void>()

function publish() {
  for (const listener of listeners) listener()
}

function fromUrl(): number | null {
  if (typeof window === "undefined") return null
  const raw = new URLSearchParams(window.location.search).get(PARAM)
  if (!raw) return null
  const year = Number(raw)
  // Bounded so a hand-edited URL cannot send the charts somewhere absurd.
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null
}

function writeUrl(year: number) {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (year === CURRENT_YEAR) url.searchParams.delete(PARAM)
  else url.searchParams.set(PARAM, String(year))
  if (url.toString() !== window.location.href) {
    window.history.replaceState(window.history.state, "", url)
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)

  // Adopt the year in the address bar on the first subscription, after
  // hydration — never during it, or the server and client would disagree
  // about what to render.
  if (!readUrlYet) {
    readUrlYet = true
    const urlYear = fromUrl()
    if (urlYear !== null && urlYear !== cache) {
      cache = urlYear
      queueMicrotask(publish)
    }
  }

  return () => listeners.delete(onChange)
}

function getSnapshot() {
  return cache
}

function getServerSnapshot() {
  return CURRENT_YEAR
}

export function setSelectedYear(year: number) {
  if (year === cache) return
  cache = year
  writeUrl(year)
  publish()
}

/** Forgets the year, so the next account starts on the current one. */
export function resetSelectedYear() {
  cache = CURRENT_YEAR
  readUrlYet = false
  publish()
}

/**
 * The selected year, and a setter. Every page showing yearly figures uses
 * this, so they all move together.
 */
export function useSelectedYear(): [number, (year: number) => void] {
  const year = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  // Arriving on a page keeps the address bar honest about which year it shows.
  React.useEffect(() => {
    writeUrl(year)
  }, [year])

  return [year, setSelectedYear]
}

export { CURRENT_YEAR }
