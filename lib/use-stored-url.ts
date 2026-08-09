"use client"

import * as React from "react"

/**
 * Resolves a stored object path to a link the browser can load.
 *
 * Both buckets are private, so there is no URL to put in a src attribute until
 * one has been signed for. That makes displaying a stored image asynchronous,
 * and this hook is where that lives so the components using it can stay as
 * simple as an img tag.
 *
 * The resolver is passed in rather than the bucket name, so each caller brings
 * its own — lib/avatars and lib/attachments both already expose one, and
 * links are cached in lib/storage rather than here.
 */
export function useStoredUrl(
  path: string | undefined,
  resolve: (path: string) => Promise<string | null>
) {
  // The path is held alongside the result rather than cleared when it changes,
  // so switching images reads as "not resolved yet" without the effect having
  // to reset any state on its way in.
  const [resolved, setResolved] = React.useState<{
    path: string
    url: string | null
  } | null>(null)

  // Kept in a ref so that passing an inline function does not re-run the
  // effect on every render.
  const resolver = React.useRef(resolve)
  React.useEffect(() => {
    resolver.current = resolve
  }, [resolve])

  React.useEffect(() => {
    if (!path) return
    let active = true

    void resolver.current(path).then((url) => {
      // The row may have collapsed, or the page changed, while it was signing.
      if (active) setResolved({ path, url })
    })

    return () => {
      active = false
    }
  }, [path])

  const current = resolved?.path === path ? resolved : null
  return { url: current?.url ?? null, failed: current?.url === null }
}
