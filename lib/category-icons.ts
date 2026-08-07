// Picks an icon for a category name. Known money concepts get a matching
// icon; anything else is hashed into a pool of neutral icons, so a category
// the user invents today gets a stable icon immediately and keeps it forever.

import {
  Award01Icon,
  BankIcon,
  BanknoteIcon,
  Briefcase01Icon,
  Building01Icon,
  ChartLineData01Icon,
  Coins01Icon,
  CompassIcon,
  CpuIcon,
  DollarCircleIcon,
  Download01Icon,
  FlashIcon,
  GiftIcon,
  Globe02Icon,
  HandshakeIcon,
  HourglassIcon,
  Invoice01Icon,
  LaptopIcon,
  Layers01Icon,
  Leaf01Icon,
  PackageIcon,
  PackageOpenIcon,
  PaintBoardIcon,
  PiggyBankIcon,
  Rocket01Icon,
  SparklesIcon,
  SquareLock01Icon,
  Target01Icon,
  TaskDone01Icon,
  TradeUpIcon,
  Upload01Icon,
  UserGroupIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import { makeIcon, type AppIcon } from "@/components/icons"

// First match wins, so the more specific patterns come first. Related-but-
// distinct concepts get their own icon rather than sharing one, so two
// categories rarely land on the same glyph.
const KEYWORD_ICONS: [RegExp, IconSvgElement][] = [
  [/pre[-\s]?market/i, HourglassIcon],
  [/launch(pool|pad)/i, Leaf01Icon],
  [/ido|ico|presale/i, Rocket01Icon],
  [/alpha/i, SparklesIcon],
  [/airdrop/i, GiftIcon],
  [/surprise|drop/i, PackageOpenIcon],
  [/fee|charge|commission/i, Invoice01Icon],
  [/tax|vat|duty/i, BankIcon],
  [/earn|apr|apy|interest|yield|savings/i, PiggyBankIcon],
  [/stak|lock/i, SquareLock01Icon],
  [/predict|bet|wager/i, Target01Icon],
  [/withdraw/i, Upload01Icon],
  [/deposit|top[-\s]?up/i, Download01Icon],
  [/p2p|fiat|cash|remit/i, BanknoteIcon],
  [/salary|payroll|wage|job/i, Briefcase01Icon],
  [/freelance|client|contract|consult|gig/i, LaptopIcon],
  [/referral|affiliate|invite/i, UserGroupIcon],
  [/mining|node|validator|hardware/i, CpuIcon],
  [/trade|trading|spot|futures|margin/i, ChartLineData01Icon],
  [/quest|task|bounty/i, TaskDone01Icon],
  [/bonus|reward|prize|win/i, Award01Icon],
  [/nft|art|collect/i, PaintBoardIcon],
  [/loan|lend|debt|borrow/i, HandshakeIcon],
  [/gift|donation/i, GiftIcon],
  [/exchange|binance|bitget|bybit|okx|kucoin/i, Building01Icon],
]

// Deterministic pool for categories that match no keyword.
const FALLBACK_ICONS: IconSvgElement[] = [
  Coins01Icon,
  Wallet01Icon,
  TradeUpIcon,
  Layers01Icon,
  SparklesIcon,
  PackageIcon,
  DollarCircleIcon,
  Globe02Icon,
  FlashIcon,
  CompassIcon,
]

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

// Components are built once at module load, not per render — otherwise every
// row would mount a brand-new component type and lose its DOM each time.
const iconCache = new Map<IconSvgElement, AppIcon>()

function componentFor(glyph: IconSvgElement): AppIcon {
  let component = iconCache.get(glyph)
  if (!component) {
    component = makeIcon(glyph)
    iconCache.set(glyph, component)
  }
  return component
}

export function getCategoryIcon(name?: string): AppIcon {
  if (!name || name.trim() === "") return componentFor(Coins01Icon)
  for (const [pattern, glyph] of KEYWORD_ICONS) {
    if (pattern.test(name)) return componentFor(glyph)
  }
  return componentFor(
    FALLBACK_ICONS[hashString(name.toLowerCase()) % FALLBACK_ICONS.length]
  )
}
