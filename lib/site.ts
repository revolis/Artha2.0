// Single source of truth for the app's identity, used by the layout, the
// sidebar, and every generated report document.

export const SITE = {
  name: "ARTHA",
  tagline: "Take Control of Your Financial Future",
  logoPath: "/logo.png",
  /**
   * Shown on About and in Settings. Was "0.1 · Design preview", which stopped
   * being true once the app had accounts, a database and a domain — it read as
   * a warning not to trust it with anything.
   */
  version: "1.0",
} as const
