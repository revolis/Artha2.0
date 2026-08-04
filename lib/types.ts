// Data shapes for Artha. These mirror the "Data shapes" section in SPEC.md —
// mock data conforms to these so a real backend can be swapped in later.

export type Currency = "NPR" | "USD"
export type AssetType = "crypto" | "stock" | "cash"

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  createdAt: string
}

export interface Settings {
  displayCurrency: Currency
  usdToNprRate: number
  rateUpdatedAt: string
  theme: "light" | "dark" | "system"
}

export interface Entry {
  id: string
  kind: "buy" | "sell" | "income"
  assetType: AssetType
  symbol?: string
  assetName?: string
  quantity?: number
  pricePerUnit?: number
  amount: number
  currency: Currency
  category?: string
  date: string
  notes?: string
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
  currentAmount: number
  currency: Currency
  startDate?: string // period start (ISO) — a goal can span days, months, a quarter, a year…
  endDate?: string // period end (ISO)
  completedAt?: string // ISO date the goal was reached, if it has been
  showOnDashboard?: boolean // pinned to the dashboard's goals section
  color?: string
}
