// A full demo ledger — spread across 2024 to 2027 — so every chart, table and
// heatmap in the app has something real-looking to draw, whichever year the
// year switcher is pointed at.
//
// The entries are generated rather than typed out one by one, but they are not
// random in the usual sense: everything comes from a fixed seed, so the ledger
// is identical on every reload and identical on the server and in the browser.
// That second part matters — genuinely random data would differ between the
// two and React would complain the moment the page loaded.
//
// Nothing here reads the clock, so the ledger stays put no matter when the
// site is opened.

import type { Entry, EntryType } from "@/lib/types"

// Where the present sits in the demo. The month this falls in is cut short at
// this day, so the ongoing year doesn't look finished. Years after it are
// dated ahead on purpose — the year switcher can reach them.
const TODAY = { year: 2026, month: 7, day: 7 } // 7 August 2026

/** Seeded random-number generator (mulberry32). Same seed, same sequence. */
function makeRandom(seed: number) {
  let state = seed >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = makeRandom(20260807)

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rnd() * items.length)]
}

function between(min: number, max: number): number {
  return min + rnd() * (max - min)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Fisher-Yates, driven by the same seeded generator. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// A kind of transaction: what it's called, where it comes from, what it's
// usually worth, and the sort of thing you'd write in the note.
interface Flavour {
  category: string
  sources: string[]
  tags: string[]
  min: number
  max: number
  notes: string[]
}

// Money coming in. The ranges are in USD at 2026 scale — earlier years are
// scaled down, so the running total climbs year on year.
const PROFIT_FLAVOURS: Flavour[] = [
  {
    category: "Binance Alpha",
    sources: ["s_2"],
    tags: ["alpha", "airdrop-season"],
    min: 90,
    max: 620,
    notes: [
      "Alpha points redeemed the moment the pool opened.",
      "Held the points a day longer and it paid off.",
      "Second alpha claim this month — the queue was quick.",
      "Points balance finally crossed the threshold.",
      "Claimed early; price faded by the afternoon.",
    ],
  },
  {
    category: "Airdrop",
    sources: ["s_1", "s_3", "s_7", "s_9"],
    tags: ["airdrop-season", "testnet", "mainnet"],
    min: 60,
    max: 940,
    notes: [
      "Testnet work from last autumn finally paid out.",
      "Claimed and sold straight away — no conviction here.",
      "Snapshot caught my wallet by luck.",
      "Kept a third of the allocation, sold the rest.",
      "Gas was ugly but the claim was worth it.",
    ],
  },
  {
    category: "Launchpool",
    sources: ["s_1", "s_3", "s_8"],
    tags: ["launchpad", "passive"],
    min: 45,
    max: 330,
    notes: [
      "Staked for the full seven days.",
      "Farmed with idle stablecoins — nothing at risk.",
      "Small pool, but free money for parked funds.",
      "Moved the stake over on day two for the better APR.",
    ],
  },
  {
    category: "IDO",
    sources: ["s_3", "s_8"],
    tags: ["launchpad", "high-conviction"],
    min: 80,
    max: 780,
    notes: [
      "Allocation was tiny but the listing ran hard.",
      "Sold half on listing, holding the rest.",
      "Won the lottery ticket this round.",
      "Took the profit at 2x rather than getting greedy.",
    ],
  },
  {
    category: "PreMarket",
    sources: ["s_3", "s_6"],
    tags: ["premarket", "quick-flip"],
    min: 40,
    max: 420,
    notes: [
      "Sold the pre-market position before listing.",
      "Pre-market premium was too good to pass up.",
      "Closed it early — spread was widening.",
    ],
  },
  {
    category: "Simple Earn (APR)",
    sources: ["s_1", "s_6"],
    tags: ["passive", "long-term"],
    min: 22,
    max: 165,
    notes: [
      "Monthly APR payout.",
      "Flexible savings interest.",
      "Locked product matured today.",
      "Interest on the stablecoin balance.",
    ],
  },
  {
    category: "Staking Rewards",
    sources: ["s_7", "s_9", "s_10"],
    tags: ["passive", "long-term", "defi"],
    min: 18,
    max: 210,
    notes: [
      "Validator rewards for the epoch.",
      "Auto-compounding, claimed the surplus.",
      "Restaking rewards on top of the base yield.",
    ],
  },
  {
    category: "Spot Trading",
    sources: ["s_1", "s_6", "s_10"],
    tags: ["bluechip", "quick-flip"],
    min: 55,
    max: 690,
    notes: [
      "Bought the dip on Sunday, sold into strength.",
      "Range trade played out exactly as planned.",
      "Took profit into the weekly close.",
      "Scaled out in three parts on the way up.",
    ],
  },
  {
    category: "Futures Trading",
    sources: ["s_6", "s_9"],
    tags: ["risky", "quick-flip"],
    min: 70,
    max: 880,
    notes: [
      "Low leverage, stop respected, clean exit.",
      "Caught the funding flip nicely.",
      "Closed before the news print — no point gambling.",
    ],
  },
  {
    category: "Copy Trading",
    sources: ["s_3", "s_6"],
    tags: ["passive", "bot-trade"],
    min: 30,
    max: 260,
    notes: [
      "Copy portfolio settled up for the week.",
      "Trimmed the allocation after a good run.",
    ],
  },
  {
    category: "Grid Bot",
    sources: ["s_1", "s_8"],
    tags: ["bot-trade", "passive"],
    min: 15,
    max: 190,
    notes: [
      "Bot closed 40-odd grids in a choppy week.",
      "Sideways market is exactly what this thing wants.",
      "Reset the range wider after the breakout.",
    ],
  },
  {
    category: "Perp Funding",
    sources: ["s_9"],
    tags: ["defi", "passive"],
    min: 12,
    max: 140,
    notes: [
      "Funding stayed positive all week.",
      "Delta-neutral position collecting funding.",
    ],
  },
  {
    category: "Liquidity Mining",
    sources: ["s_9", "s_7"],
    tags: ["defi", "layer2"],
    min: 25,
    max: 240,
    notes: [
      "LP fees for the fortnight, impermanent loss stayed small.",
      "Pulled liquidity after the incentives dropped.",
    ],
  },
  {
    category: "Prediction Market",
    sources: ["s_4"],
    tags: ["risky", "high-conviction"],
    min: 35,
    max: 540,
    notes: [
      "Market resolved in my favour.",
      "Sold the position before resolution at a decent price.",
      "Called the outcome early and sized it properly.",
      "Election market paid out overnight.",
    ],
  },
  {
    category: "Quest Rewards",
    sources: ["s_2", "s_3", "s_7"],
    tags: ["airdrop-season", "small-win"],
    min: 8,
    max: 95,
    notes: [
      "Finished the weekly quest set.",
      "Twenty minutes of clicking for a free lunch.",
      "Task board cleared before the reset.",
    ],
  },
  {
    category: "Learn & Earn",
    sources: ["s_1", "s_8"],
    tags: ["small-win"],
    min: 6,
    max: 60,
    notes: [
      "Watched the videos, passed the quiz.",
      "Free tokens for five minutes of reading.",
    ],
  },
  {
    category: "Referral Bonus",
    sources: ["s_1", "s_3", "s_6"],
    tags: ["referral", "passive"],
    min: 10,
    max: 130,
    notes: [
      "Commission from friends trading this month.",
      "Referral tier bumped up, so the rate improved.",
    ],
  },
  {
    category: "NFT Flip",
    sources: ["s_7", "s_9"],
    tags: ["quick-flip", "risky"],
    min: 40,
    max: 460,
    notes: [
      "Minted cheap, listed into the hype.",
      "Held two days longer than I meant to and still won.",
    ],
  },
  {
    category: "Memecoin Trade",
    sources: ["s_9", "s_6"],
    tags: ["memecoin", "risky", "quick-flip"],
    min: 45,
    max: 720,
    notes: [
      "In and out inside an hour — not repeating that often.",
      "Took the 3x and left the table.",
      "Sized small on purpose. Glad I did.",
    ],
  },
  {
    category: "Dividend",
    sources: ["s_11"],
    tags: ["stocks", "dividend", "long-term"],
    min: 20,
    max: 180,
    notes: [
      "Quarterly dividend landed.",
      "Reinvested most of it, kept a little as cash.",
      "Dividend raised again this year.",
    ],
  },
  {
    category: "Stock Sale",
    sources: ["s_11"],
    tags: ["stocks", "long-term", "big-win"],
    min: 120,
    max: 1150,
    notes: [
      "Trimmed the position after a strong quarter.",
      "Sold into earnings strength.",
      "Rebalanced out of the winner back into cash.",
    ],
  },
  {
    category: "Options Premium",
    sources: ["s_11"],
    tags: ["stocks", "passive"],
    min: 35,
    max: 320,
    notes: [
      "Covered calls expired worthless — best outcome.",
      "Sold puts on a name I actually want to own.",
    ],
  },
  {
    category: "Freelance Project",
    sources: ["s_12"],
    tags: ["freelance", "cash-income"],
    min: 150,
    max: 980,
    notes: [
      "Landing page build, invoiced on delivery.",
      "Second milestone released by the client.",
      "Rush job over the weekend — charged accordingly.",
      "Small dashboard fix, quick turnaround.",
    ],
  },
  {
    category: "Consulting Retainer",
    sources: ["s_12"],
    tags: ["freelance", "cash-income", "long-term"],
    min: 200,
    max: 700,
    notes: [
      "Monthly retainer, same as last month.",
      "Retainer plus two extra hours this month.",
    ],
  },
  {
    category: "Content Bounty",
    sources: ["s_12", "s_2"],
    tags: ["freelance", "small-win"],
    min: 25,
    max: 220,
    notes: ["Thread bounty paid out.", "Tutorial accepted by the review team."],
  },
]

const LOSS_FLAVOURS: Flavour[] = [
  {
    category: "Prediction Market",
    sources: ["s_4"],
    tags: ["risky"],
    min: 20,
    max: 260,
    notes: [
      "Market went the wrong way. Sized it too big.",
      "Sports market resolved against me.",
      "Should have closed when it turned.",
    ],
  },
  {
    category: "Futures Trading",
    sources: ["s_6", "s_9"],
    tags: ["risky"],
    min: 30,
    max: 380,
    notes: [
      "Stopped out on the wick. Annoying but correct.",
      "Held through the news and paid for it.",
      "Cut it early once the setup broke.",
    ],
  },
  {
    category: "Memecoin Trade",
    sources: ["s_9"],
    tags: ["memecoin", "risky"],
    min: 25,
    max: 300,
    notes: [
      "Chased the candle. Lesson repeated.",
      "Liquidity vanished before I could exit properly.",
    ],
  },
  {
    category: "Spot Trading",
    sources: ["s_1", "s_10"],
    tags: ["bluechip"],
    min: 20,
    max: 240,
    notes: [
      "Cut the position rather than hoping.",
      "Wrong side of a sharp move.",
    ],
  },
  {
    category: "PreMarket",
    sources: ["s_3"],
    tags: ["premarket", "risky"],
    min: 15,
    max: 160,
    notes: [
      "Pre-market price never held after listing.",
      "Bought the premium, listing came in lower.",
    ],
  },
  {
    category: "NFT Flip",
    sources: ["s_7"],
    tags: ["quick-flip", "risky"],
    min: 25,
    max: 210,
    notes: ["Floor fell through before I listed.", "Mint went nowhere."],
  },
  {
    category: "Stock Sale",
    sources: ["s_11"],
    tags: ["stocks"],
    min: 40,
    max: 340,
    notes: [
      "Took the loss and moved the money somewhere better.",
      "Thesis broke, so I sold.",
    ],
  },
]

const FEE_FLAVOURS: Flavour[] = [
  {
    category: "Withdrawal Fee",
    sources: ["s_1", "s_3", "s_6", "s_8"],
    tags: ["gas"],
    min: 0.8,
    max: 22,
    notes: [
      "Network was busy — should have waited an hour.",
      "Flat withdrawal charge.",
      "Batched two withdrawals to save on this.",
    ],
  },
  {
    category: "Trading Fee",
    sources: ["s_1", "s_6", "s_10", "s_11"],
    tags: [],
    min: 0.5,
    max: 34,
    notes: ["Taker fees for the week.", "Maker rebate softened it a little."],
  },
  {
    category: "Network Gas",
    sources: ["s_9", "s_7"],
    tags: ["gas", "defi", "layer2"],
    min: 0.4,
    max: 28,
    notes: [
      "Mainnet gas for the claim.",
      "Bridged to the layer 2 to stop paying this.",
      "Failed transaction still cost me gas.",
    ],
  },
  {
    category: "Subscription",
    sources: ["s_12", "s_11"],
    tags: [],
    min: 5,
    max: 40,
    notes: ["Charting tool, billed monthly.", "Portfolio tracker renewal."],
  },
]

const TAX_FLAVOURS: Flavour[] = [
  {
    category: "Capital Gains Tax",
    sources: ["s_11", "s_1"],
    tags: ["taxes", "quarterly"],
    min: 45,
    max: 380,
    notes: [
      "Set aside for the quarter's gains.",
      "Advance payment so there's no surprise later.",
    ],
  },
  {
    category: "Income Tax",
    sources: ["s_12"],
    tags: ["taxes", "quarterly", "freelance"],
    min: 60,
    max: 420,
    notes: [
      "Freelance income tax instalment.",
      "Quarterly self-assessment payment.",
    ],
  },
  {
    category: "TDS",
    sources: ["s_12", "s_11"],
    tags: ["taxes"],
    min: 15,
    max: 140,
    notes: ["Deducted at source by the client.", "Withholding on the payout."],
  },
]

const TRANSFER_FLAVOURS: Flavour[] = [
  {
    category: "Exchange Transfer",
    sources: ["s_1", "s_3", "s_6", "s_7"],
    tags: [],
    min: 100,
    max: 900,
    notes: [
      "Moved funds over for a launchpool.",
      "Consolidating balances onto one exchange.",
      "Shifted to the exchange with the better fee tier.",
    ],
  },
  {
    category: "Wallet Top-up",
    sources: ["s_9"],
    tags: ["defi"],
    min: 80,
    max: 600,
    notes: [
      "Funded the wallet ahead of a mint.",
      "Bridged over for the week's farming.",
    ],
  },
]

// Fiat/P2P is its own shape — direction, cash currency and rate — so it gets
// its own small table rather than a Flavour.
const P2P_SOURCES = ["s_5", "s_13", "s_1"]
const P2P_TAGS = ["npr-cashout", "cash-income"]
const P2P_SELL_NOTES = [
  "Sold USDT for NPR cash.",
  "Cashed out for the month's expenses.",
  "Rate was good, took more than usual.",
  "Met at the usual place, paid in full.",
  "Split it across two transfers to keep it simple.",
  "Sold a chunk before the rate slipped back.",
]
const P2P_BUY_NOTES = [
  "Topped up USDT with cash on hand.",
  "Bought the dip with rupees rather than selling anything.",
  "Rate dropped, so I bought in.",
  "Put spare cash back into the exchange.",
]

// NPR per USD, drifting upward across the years the way it really has.
const RATE_BASE: Record<number, number> = {
  2024: 132,
  2025: 138,
  2026: 146.5,
  2027: 152.5,
}
const RATE_DRIFT: Record<number, number> = {
  2024: 0.48,
  2025: 0.55,
  2026: 0.78,
  2027: 0.6,
}

interface YearPlan {
  year: number
  /** Amounts scale up year on year, so the running total curves upward. */
  scale: number
  /** Entries per month, January first. A short array ends the year early. */
  perMonth: number[]
}

const YEAR_PLANS: YearPlan[] = [
  // The first year — an account finding its feet, so the numbers are small.
  { year: 2024, scale: 0.34, perMonth: [1, 2, 2, 3, 3, 3, 2, 3, 3, 4, 3, 4] },
  // A full twelve months of activity, which is what the year charts want.
  { year: 2025, scale: 0.62, perMonth: [6, 6, 7, 7, 8, 7, 6, 7, 8, 8, 7, 8] },
  // This year, up to the demo's last day.
  { year: 2026, scale: 1, perMonth: [12, 11, 13, 12, 14, 13, 12, 6] },
  // A year ahead, so the year switcher has a full twelve months to show
  // there too. Dated in the future on purpose — it's a demo ledger.
  {
    year: 2027,
    scale: 1.22,
    perMonth: [12, 11, 13, 12, 14, 13, 12, 13, 14, 13, 12, 14],
  },
]

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/**
 * The mix of transaction types for one month. Specials are added first and
 * profit fills the rest, so every month keeps at least one entry of income.
 */
function typesForMonth(count: number, month: number): EntryType[] {
  const isTaxMonth = month === 2 || month === 5 || month === 8 || month === 11
  const wanted: [EntryType, number][] = [
    ["p2p", count >= 8 ? 2 : count >= 3 ? 1 : 0],
    ["fee", Math.round(count * 0.12)],
    ["loss", Math.round(count * 0.13)],
    ["tax", isTaxMonth && count >= 5 ? 1 : 0],
    ["transfer", count >= 7 && rnd() < 0.35 ? 1 : 0],
  ]

  const types: EntryType[] = []
  for (const [type, howMany] of wanted) {
    for (let i = 0; i < howMany; i += 1) {
      // Always leave room for one profit, so no month reads as pure expense.
      if (types.length < count - 1) types.push(type)
    }
  }
  while (types.length < count) types.push("profit")
  return shuffled(types)
}

function flavoursFor(type: EntryType): Flavour[] {
  if (type === "loss") return LOSS_FLAVOURS
  if (type === "fee") return FEE_FLAVOURS
  if (type === "tax") return TAX_FLAVOURS
  if (type === "transfer") return TRANSFER_FLAVOURS
  return PROFIT_FLAVOURS
}

/** Zero, one or two tags from the flavour's own pool. */
function tagsFor(flavour: Flavour): string[] {
  if (flavour.tags.length === 0) return []
  const roll = rnd()
  if (roll < 0.18) return []
  if (roll < 0.72 || flavour.tags.length === 1) return [pick(flavour.tags)]
  const shuffledTags = shuffled(flavour.tags)
  return [shuffledTags[0], shuffledTags[1]]
}

interface Draft {
  entry: Entry
  note: string
}

function build(): Entry[] {
  const drafts: Draft[] = []
  let monthsElapsed = 0
  let counter = 0

  for (const plan of YEAR_PLANS) {
    for (let month = 0; month < plan.perMonth.length; month += 1) {
      const count = plan.perMonth[month]
      // Amounts creep up month by month on top of the yearly step, which is
      // what gives the running-total line its gentle upward curve.
      const growth = 1 + monthsElapsed * 0.011
      monthsElapsed += 1

      const isCurrentMonth = plan.year === TODAY.year && month === TODAY.month
      const lastDay = isCurrentMonth ? TODAY.day : daysInMonth(plan.year, month)

      const types = typesForMonth(count, month)

      for (let index = 0; index < count; index += 1) {
        // One entry per slot, so the days spread across the whole month
        // instead of bunching up at the start.
        const slotStart = Math.floor((index * lastDay) / count) + 1
        const slotEnd = Math.max(
          slotStart,
          Math.floor(((index + 1) * lastDay) / count)
        )
        const day = slotStart + Math.floor(rnd() * (slotEnd - slotStart + 1))
        const hour = 8 + Math.floor(rnd() * 15)
        const minute = Math.floor(rnd() * 12) * 5
        const datetime = `${plan.year}-${pad(month + 1)}-${pad(Math.min(day, lastDay))}T${pad(hour)}:${pad(minute)}`

        const type = types[index]
        counter += 1
        const id = `d_${plan.year}_${pad(month + 1)}_${counter}`

        if (type === "p2p") {
          const sell = rnd() < 0.75
          const amount = round2(
            (sell ? between(130, 720) : between(70, 330)) * plan.scale * growth
          )
          const rate = round2(
            RATE_BASE[plan.year] +
              month * RATE_DRIFT[plan.year] +
              between(-0.7, 0.7)
          )
          drafts.push({
            entry: {
              id,
              datetime,
              type: "p2p",
              category: "P2P Cash",
              tags: rnd() < 0.25 ? [] : [pick(P2P_TAGS)],
              sourceId: pick(P2P_SOURCES),
              amount,
              p2p: {
                direction: sell ? "usd-to-cash" : "cash-to-usd",
                cashCurrency: "NPR",
                rate,
                cashAmount: round2(amount * rate),
              },
            },
            note: pick(sell ? P2P_SELL_NOTES : P2P_BUY_NOTES),
          })
          continue
        }

        const flavour = pick(flavoursFor(type))
        // A handful of outsized wins each year give the charts some character.
        const bigWin = type === "profit" && rnd() < 0.07 ? between(1.4, 2.2) : 1
        const amount = round2(
          between(flavour.min, flavour.max) * plan.scale * growth * bigWin
        )

        drafts.push({
          entry: {
            id,
            datetime,
            type,
            category: flavour.category,
            tags: tagsFor(flavour),
            sourceId: pick(flavour.sources),
            amount,
          },
          note: pick(flavour.notes),
        })
      }
    }
  }

  // Notes on exactly 70% of entries, picked across the whole ledger rather
  // than by chance per entry, so the share is the same every time.
  const indices = shuffled(drafts.map((_, index) => index))
  const withNotes = Math.round(drafts.length * 0.7)
  for (const index of indices.slice(0, withNotes)) {
    drafts[index].entry.note = drafts[index].note
  }

  // A few entries carry a screenshot. These are names only — the demo doesn't
  // ship image data — so the entry panel shows them as named attachments.
  for (const index of indices.slice(withNotes, withNotes + 14)) {
    const entry = drafts[index].entry
    const slug = (entry.category ?? "entry").toLowerCase().replace(/\W+/g, "-")
    entry.attachments = [{ name: `${slug}-${entry.datetime.slice(0, 10)}.png` }]
  }

  return drafts.map((draft) => draft.entry)
}

export const demoEntries: Entry[] = build()
