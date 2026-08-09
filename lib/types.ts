// Data shapes for Artha. These mirror the "Data shapes" section in SPEC.md —
// mock data conforms to these so a real backend can be swapped in later.

export type Currency = "USD" | "NPR" | "INR" | "EUR" | "GBP" | "AED"
export type AssetType = "crypto" | "stock" | "cash"

export type TimeFormat = "12h" | "24h"

export type NotificationKey =
  | "goalMilestones"
  | "weeklySummary"
  | "monthlyReport"
  | "largeEntries"
  | "rateSync"
  | "productNews"

export interface NotificationPref {
  inApp: boolean
  email: boolean
}

export interface AppSettings {
  /** Currency every amount on the site is displayed in. */
  displayCurrency: Currency
  language: string
  timezone: string
  timeFormat: TimeFormat
  notifications: Record<NotificationKey, NotificationPref>
  /** Masks every amount on screen without changing any data. */
  privacyMode: boolean
  /** How the account was created — drives the security recommendations. */
  loginMethod: "google" | "password"
  hasPassword: boolean
}

export interface SocialLink {
  id: string
  /** Which network — free text so any platform can be added. */
  platform: string
  url: string
}

export interface UserProfile {
  id: string
  /** Platform handle, e.g. "rajan" in artha.app/@rajan. */
  username: string
  name: string
  email: string
  /** Object path in the avatars bucket. Takes priority over avatarId. */
  avatarPath?: string
  /** Id of a built-in preset avatar when no photo is uploaded. */
  avatarId?: string
  bio?: string
  location?: string
  timezone?: string
  website?: string
  socials: SocialLink[]
  createdAt: string
}

export type EntryType = "profit" | "loss" | "p2p" | "fee" | "tax" | "transfer"

// Where money comes from — an exchange, a platform, a person, a campaign.
export interface Source {
  id: string
  name: string
  socialHandle?: string // e.g. "@binance"
  platformUrl?: string // link to the platform
  campaignUrl?: string // link to the specific campaign/airdrop
}

// Extra details recorded on Fiat/P2P entries: which way the money moved,
// what cash currency was involved, and at what rate.
export interface P2PDetails {
  direction: "usd-to-cash" | "cash-to-usd" // sold USD vs bought USD
  cashCurrency: string // e.g. "NPR" (default)
  rate: number // cash units per 1 USD, entered manually
  cashAmount: number // amount × rate, auto-calculated
}

// An image attached to an entry. The picture itself is in Storage; this is the
// name to show and where to find it.
export interface EntryAttachment {
  name: string
  /**
   * Object path in the private entry-attachments bucket. Absent on seed rows
   * and on anything saved back when attachments were filenames only, which is
   * why everything that renders one has to handle its absence.
   */
  path?: string
}

export interface Entry {
  id: string
  datetime: string // ISO date + time, e.g. "2026-08-04T14:30"
  type: EntryType
  category?: string
  tags: string[]
  sourceId?: string // references a Source
  amount: number // always positive, in USD; sign comes from `type`
  p2p?: P2PDetails // only on type "p2p"
  note?: string
  attachments?: EntryAttachment[]
}

export interface AssetPrice {
  symbol: string
  assetType: AssetType
  currentPrice: number
  currency: Currency
  updatedAt: string
}

export interface Goal {
  id: string
  title: string
  targetAmount: number
  /**
   * Stored, but every screen shows progress worked out from the entries
   * instead. Kept so older rows still load.
   */
  currentAmount: number
  /**
   * Which entries count toward this goal. Undefined counts all net income,
   * which suits a savings or portfolio target; a category narrows it to the
   * entries that belong to it.
   */
  trackCategory?: string
  currency: Currency
  startDate?: string // period start (ISO) — a goal can span days, months, a quarter, a year…
  endDate?: string // period end (ISO)
  completedAt?: string // ISO date the goal was reached, if it has been
  showOnDashboard?: boolean // pinned to the dashboard's goals section
  color?: string
}
