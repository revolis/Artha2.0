// Picks an icon for a category name. Known money concepts get a matching
// icon; anything else is hashed into a pool of neutral icons, so a category
// the user invents today gets a stable icon immediately and keeps it forever.

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Award,
  Banknote,
  Boxes,
  Briefcase,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  Coins,
  Compass,
  Cpu,
  Gift,
  Globe,
  Handshake,
  Hourglass,
  Landmark,
  Laptop,
  Layers,
  LineChart,
  Lock,
  Package,
  PackageOpen,
  Palette,
  PiggyBank,
  Receipt,
  Rocket,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react"

// First match wins, so the more specific patterns come first. Related-but-
// distinct concepts get their own icon rather than sharing one, so two
// categories rarely land on the same glyph.
const KEYWORD_ICONS: [RegExp, LucideIcon][] = [
  [/pre[-\s]?market/i, Hourglass],
  [/launch(pool|pad)/i, Sprout],
  [/ido|ico|presale/i, Rocket],
  [/alpha/i, Sparkles],
  [/airdrop/i, Gift],
  [/surprise|drop/i, PackageOpen],
  [/fee|charge|commission/i, Receipt],
  [/tax|vat|duty/i, Landmark],
  [/earn|apr|apy|interest|yield|savings/i, PiggyBank],
  [/stak|lock/i, Lock],
  [/predict|bet|wager/i, Target],
  [/withdraw/i, ArrowUpFromLine],
  [/deposit|top[-\s]?up/i, ArrowDownToLine],
  [/p2p|fiat|cash|remit/i, Banknote],
  [/salary|payroll|wage|job/i, Briefcase],
  [/freelance|client|contract|consult|gig/i, Laptop],
  [/referral|affiliate|invite/i, Users],
  [/mining|node|validator|hardware/i, Cpu],
  [/trade|trading|spot|futures|margin/i, LineChart],
  [/quest|task|bounty/i, ClipboardCheck],
  [/bonus|reward|prize|win/i, Award],
  [/nft|art|collect/i, Palette],
  [/loan|lend|debt|borrow/i, Handshake],
  [/gift|donation/i, Gift],
  [/exchange|binance|bitget|bybit|okx|kucoin/i, Building2],
]

// Deterministic pool for categories that match no keyword.
const FALLBACK_ICONS: LucideIcon[] = [
  Coins,
  Wallet,
  TrendingUp,
  Layers,
  Sparkles,
  Boxes,
  CircleDollarSign,
  Globe,
  Zap,
  Package,
  Compass,
]

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

export function getCategoryIcon(name?: string): LucideIcon {
  if (!name || name.trim() === "") return Coins
  for (const [pattern, icon] of KEYWORD_ICONS) {
    if (pattern.test(name)) return icon
  }
  return FALLBACK_ICONS[hashString(name.toLowerCase()) % FALLBACK_ICONS.length]
}
