"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

/**
 * Reports one query-string value up to its parent, and renders nothing.
 *
 * useSearchParams forces the component calling it into a Suspense boundary on
 * a prerendered route. Wrapping a whole page in one turned out to be a serious
 * mistake: the boundary prerendered its contents and then never hydrated on
 * the client, so nothing inside it mounted — no effects, no store
 * subscriptions, no working controls. The page looked fine and did nothing.
 *
 * Keeping the call in a leaf that renders null means the boundary wraps
 * nothing of consequence, and the page itself hydrates normally.
 */
export function QueryParamSync({
  name,
  onChange,
}: {
  name: string
  onChange: (value: string) => void
}) {
  const value = useSearchParams().get(name) ?? ""

  React.useEffect(() => {
    onChange(value)
  }, [value, onChange])

  return null
}
