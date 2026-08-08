// Where to reach the person who builds Artha. One place, so the About,
// Contact and Help pages and the landing footer can never drift apart.

export const CONTACT = {
  email: "rabinacharya092@gmail.com",
  telegram: {
    handle: "@rbn_x01",
    url: "https://t.me/rbn_x01",
  },
  x: {
    handle: "@0xr8n",
    url: "https://x.com/0xr8n",
  },
} as const

export const AUTHOR = {
  /** Written with a Greek capital lambda for the A, as he signs it. */
  name: "RΛBIN",
  url: CONTACT.x.url,
} as const

/** Opens the reader's mail client with the subject already filled in. */
export function mailtoLink(subject?: string): string {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : ""
  return `mailto:${CONTACT.email}${query}`
}
