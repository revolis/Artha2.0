/**
 * Turns something a person typed into a link that can safely be followed.
 *
 * Two problems, both from the same place — these values are typed by hand into
 * a form with no validation beyond "looks like text".
 *
 * A URL without a scheme is not a URL. "www.buildpad.com" in an href is a
 * *relative* path, so the browser asks the site for /www.buildpad.com and the
 * link appears broken. Anything without a scheme is assumed to be https.
 *
 * And a scheme can be anything, including javascript:, which in an href is a
 * script that runs on click. Only http and https come back; everything else
 * returns null and the caller renders plain text instead of a link.
 */
export function externalHref(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null
  } catch {
    return null
  }
}

/** The bit worth reading — "buildpad.com/claim" rather than the whole thing. */
export function linkLabel(value: string | undefined): string {
  const href = externalHref(value)
  if (!href) return value?.trim() ?? ""
  const url = new URL(href)
  const path = url.pathname === "/" ? "" : url.pathname
  return `${url.host.replace(/^www\./, "")}${path}${url.search}`
}
