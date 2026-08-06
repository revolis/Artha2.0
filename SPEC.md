# Artha — Project Spec

A personal finance dashboard that tracks crypto, stocks, and cash income in one
place. All data is entered **manually** (no platform syncing). Totals are shown
in both **NPR and USD**.

## Who this is for

A single personal user (the owner). Built by describing features in plain
English — the builder is not a programmer, so all explanations stay simple.

## Pages

| Route        | Purpose                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `/`          | Landing — what Artha is, feature highlights, about, get in touch                                              |
| `/login`     | Auth screens — Register, Login, Forgot password (visual only for now)                                         |
| `/dashboard` | The main product — professional & premium feel: goals, charts, pie charts, recent entries, portfolio, heatmap |
| `/settings`  | Customization, profile, currency choice, export/import data                                                   |

More pages may be added while building.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (`base-luma` style, built on Base UI — not Radix)
- Other UI libraries only as needed, and only after asking
- Backend: **undecided** (Firebase / Supabase / decide later). No backend code
  until decided.

## Working rules

1. **Design first, functionality later.** Every page is built with mock data
   only. No database, no auth, no API calls until explicitly approved.
2. **One page per session.** Don't touch pages we aren't working on.
3. **shadcn components via the CLI** (`pnpm dlx shadcn@latest add <name>`).
   Never hand-write components that already exist in the registry.
4. **Theme tokens only** (`bg-background`, `text-foreground`, `text-muted-foreground`,
   etc.). Never hardcode colors like `bg-zinc-900`.
5. **Ask before** installing anything heavy or changing project structure.
6. **Commit to git** after each working step.

## Data shapes (proposal — review before any UI is built)

These are the objects the app will work with. Mock data will follow these
shapes so that wiring up a real backend later is a swap, not a rewrite.
Plain-English notes follow each shape.

```ts
type Currency = "NPR" | "USD"
type AssetType = "crypto" | "stock" | "cash"
```

### UserProfile

Who you are. Used on `/settings` and the dashboard header.

```ts
interface UserProfile {
  id: string
  username: string // platform handle, e.g. "rajan" → artha.app/@rajan
  name: string // "Rajan"
  email: string
  avatarUrl?: string // uploaded photo, stored as a data URL
  avatarId?: string // id of a built-in preset avatar, used when no photo
  bio?: string
  location?: string
  timezone?: string
  website?: string
  socials: SocialLink[]
  createdAt: string // ISO date, e.g. "2026-08-04"
}

interface SocialLink {
  id: string
  platform: string // free text: "X", "GitHub", "Telegram"…
  url: string
}
```

### Settings

Your preferences. Lives on `/settings`.

```ts
interface AppSettings {
  displayCurrency: Currency // every amount on the site is shown in this
  language: string
  timezone: string
  timeFormat: "12h" | "24h"
  notifications: Record<NotificationKey, { inApp: boolean; email: boolean }>
  privacyMode: boolean // masks every amount on screen (the header's eye button)
  loginMethod: "google" | "password"
  hasPassword: boolean
  twoFactor: boolean
}
```

Theme is owned by next-themes, not stored here.

### Exchange rates

Rates are **real, never invented**. They live outside the mock data:

```ts
type RateTable = Record<Currency, number> // units per 1 USD

interface RateState {
  rates: RateTable // what every conversion on the site uses
  updatedAt: string // ISO date the rates apply to
  source: "seed" | "live" // built-in defaults, or fetched
}
```

- `lib/rate-data.ts` — the built-in starting rates and each currency's real
  symbol. Only used before the first fetch, or if the network is unavailable.
- `lib/use-rates.ts` — the live store (localStorage) and the fetch. It is the
  only writer of the module-level rate table that `convertCurrency` /
  `formatMoney` read, so one update moves every amount on the site.
- The Fiat Currency card (dashboard, and Settings → General) shows only the
  pair you've selected and carries the Update button.
- Rates come from the daily currency-api dataset on jsDelivr: plain JSON, no
  key, CORS-open. A failed fetch keeps the last good rates rather than
  clearing them.

> **This is the project's only network call.** Everything else is still local
> mock data. Google has no public rates API and its page can't be scraped, so
> the feed above supplies the same interbank numbers Google quotes. Providers
> disagree by small fractions, and the CDN can serve the previous day's file,
> so the card always states the date the rates actually apply to rather than
> claiming they're today's.

### Entry (the core object)

Every manual addition is an Entry. The entries table, charts, heatmap, and
average monthly income are all built from these.

```ts
type EntryType = "profit" | "loss" | "p2p" | "fee" | "tax" | "transfer"

interface Entry {
  id: string
  datetime: string // ISO date + time, auto-filled with "now" in the form
  type: EntryType
  category?: string // free-form, create-or-pick: "Binance Alpha", "Prediction Market"…
  tags: string[] // free-form, create-or-pick
  sourceId?: string // references a Source
  amount: number // always positive, in USD — sign comes from `type`
  p2p?: P2PDetails // only on type "p2p" (shown as Fiat/P2P)
  note?: string
  attachments?: string[] // image file names (design phase — not uploaded anywhere)
}

interface P2PDetails {
  direction: "usd-to-cash" | "cash-to-usd" // sold USD vs bought USD
  cashCurrency: string // e.g. "NPR" (default)
  rate: number // cash units per 1 USD, entered manually
  cashAmount: number // amount × rate, auto-calculated
}
```

### Source

Where money comes from — an exchange, platform, person, or campaign.
Created inline while adding an entry, managed later on the Sources page.

```ts
interface Source {
  id: string
  name: string // "Binance", "Local P2P — Ram"
  socialHandle?: string // "@binance"
  platformUrl?: string // link to the platform
  campaignUrl?: string // link to the specific campaign/airdrop
}
```

### AssetPrice

Current market price for each asset you hold, so the portfolio can show today's
value and profit/loss. **Always entered manually** — no price syncing, ever.
Only exchange rates get a daily sync, later — see Exchange rates above.

```ts
interface AssetPrice {
  symbol: string // "BTC"
  assetType: AssetType
  currentPrice: number
  currency: Currency
  updatedAt: string
}
```

### Holding (derived — not stored)

What you currently own. Calculated from Entries + AssetPrices, never typed in
directly. Powers the portfolio table and pie chart.

```ts
interface Holding {
  symbol: string
  assetName: string
  assetType: AssetType
  quantity: number // total bought minus total sold
  avgBuyPrice: number
  currentValue: number // quantity × current price
  profitLoss: number // currentValue minus what you paid
  profitLossPct: number // same, as a percentage
  currency: Currency
}
```

### Goal

Savings/wealth targets shown on the dashboard.

```ts
interface Goal {
  id: string
  title: string // "Emergency fund", "New laptop"
  targetAmount: number
  currentAmount: number
  currency: Currency
  startDate?: string // period start (ISO) — goals can span days, months, a quarter, a year…
  endDate?: string // period end (ISO)
  completedAt?: string // ISO date the goal was reached, if it has been
  showOnDashboard?: boolean // pinned to the dashboard's goals section
  color?: string // theme chart token, e.g. "chart-1" — for the progress ring
}
```

### Open questions on data shapes

- Are **expenses** in scope, or only income? (If yes, `kind` gains `"expense"`.)
- Should cash income entries support **recurring** entries (monthly salary), or
  is manual re-entry each month fine?
- Nepali stocks (NEPSE, priced in NPR) and US stocks (priced in USD) — both?
  The shapes support both since every amount carries its currency.

## Status

- [x] Project scaffolded (Next.js + Tailwind v4 + shadcn base-luma)
- [x] shadcn agent skill installed
- [x] SPEC.md written
- [ ] Data shapes approved by owner
- [ ] `/` landing page (mock)
- [ ] `/login` (mock)
- [ ] `/dashboard` (mock)
- [ ] `/settings` (mock)
- [ ] Backend decision
