// Row ↔ app type conversion, in one place.
//
// The app's types were designed before the database existed and are what every
// component reads, so the database bends to them rather than the other way
// round. Anything awkward about the mapping is handled here so no component
// ever sees a snake_case column.

import type { Json, Tables } from "@/lib/supabase/database.types"
import type {
  AppSettings,
  Currency,
  Entry,
  EntryAttachment,
  EntryType,
  Goal,
  NotificationKey,
  NotificationPref,
  Source,
  TimeFormat,
  UserProfile,
} from "@/lib/types"

type EntryRow = Tables<"entries"> & {
  entry_attachments?: { name: string; storage_path: string | null }[] | null
}

/**
 * Postgres hands back "2026-08-04T14:30:00"; the app writes and reads
 * "2026-08-04T14:30", which is also what a datetime-local input wants. The
 * seconds are always zero — nothing in Artha records them.
 */
function toLocalDateTime(value: string): string {
  return value.slice(0, 16)
}

export function entryFromRow(row: EntryRow): Entry {
  const attachments: EntryAttachment[] = (row.entry_attachments ?? []).map(
    (item) => ({
      name: item.name,
      path: item.storage_path ?? undefined,
    })
  )

  return {
    id: row.id,
    datetime: toLocalDateTime(row.occurred_at),
    type: row.type as EntryType,
    category: row.category ?? undefined,
    tags: row.tags ?? [],
    sourceId: row.source_id ?? undefined,
    amount: Number(row.amount),
    note: row.note ?? undefined,
    p2p: row.p2p_direction
      ? {
          direction: row.p2p_direction as "usd-to-cash" | "cash-to-usd",
          cashCurrency: row.p2p_cash_currency ?? "NPR",
          rate: Number(row.p2p_rate),
          cashAmount: Number(row.p2p_cash_amount),
        }
      : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  }
}

/** The entries row for an insert or update. Attachments are written separately. */
export function entryToRow(entry: Entry) {
  return {
    id: entry.id,
    occurred_at: entry.datetime,
    type: entry.type,
    category: entry.category ?? null,
    tags: entry.tags,
    source_id: entry.sourceId ?? null,
    amount: entry.amount,
    note: entry.note ?? null,
    p2p_direction: entry.p2p?.direction ?? null,
    p2p_cash_currency: entry.p2p?.cashCurrency ?? null,
    p2p_rate: entry.p2p?.rate ?? null,
    p2p_cash_amount: entry.p2p?.cashAmount ?? null,
  }
}

export function sourceFromRow(row: Tables<"sources">): Source {
  return {
    id: row.id,
    name: row.name,
    socialHandle: row.social_handle ?? undefined,
    platformUrl: row.platform_url ?? undefined,
    campaignUrl: row.campaign_url ?? undefined,
  }
}

export function sourceToRow(source: Source) {
  return {
    id: source.id,
    name: source.name,
    social_handle: source.socialHandle ?? null,
    platform_url: source.platformUrl ?? null,
    campaign_url: source.campaignUrl ?? null,
  }
}

export function goalFromRow(row: Tables<"goals">): Goal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    trackCategory: row.track_category ?? undefined,
    currency: row.currency as Currency,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    completedAt: row.completed_at ?? undefined,
    showOnDashboard: row.show_on_dashboard,
    color: row.color ?? undefined,
  }
}

export function goalToRow(goal: Goal) {
  return {
    id: goal.id,
    title: goal.title,
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount,
    track_category: goal.trackCategory ?? null,
    currency: goal.currency,
    start_date: goal.startDate ?? null,
    end_date: goal.endDate ?? null,
    completed_at: goal.completedAt ?? null,
    show_on_dashboard: goal.showOnDashboard ?? false,
    color: goal.color ?? null,
  }
}

const NOTIFICATION_KEYS: NotificationKey[] = [
  "goalMilestones",
  "weeklySummary",
  "monthlyReport",
  "largeEntries",
  "rateSync",
  "productNews",
]

export function settingsFromRow(
  row: Tables<"settings">,
  fallback: AppSettings
): AppSettings {
  // notifications is jsonb, so it is `Json` as far as the types go. Each key is
  // read back individually rather than cast wholesale — a column edited by hand
  // should not be able to hand the UI an undefined preference.
  const raw = (row.notifications ?? {}) as Record<string, unknown>
  const notifications = {} as Record<NotificationKey, NotificationPref>
  for (const key of NOTIFICATION_KEYS) {
    const value = raw[key] as Partial<NotificationPref> | undefined
    notifications[key] = {
      inApp: value?.inApp ?? fallback.notifications[key].inApp,
      email: value?.email ?? fallback.notifications[key].email,
    }
  }

  return {
    displayCurrency: row.display_currency as Currency,
    language: row.language,
    timezone: row.timezone,
    timeFormat: row.time_format as TimeFormat,
    notifications,
    privacyMode: row.privacy_mode,
    loginMethod: row.login_method as "google" | "password",
    hasPassword: row.has_password,
  }
}

export function settingsToRow(settings: AppSettings) {
  // Rebuilt key by key rather than cast: NotificationPref is an interface, so
  // TypeScript will not accept it as Json without an index signature, and a
  // blind cast would also let a stray field through into the column.
  const notifications: Json = {}
  for (const key of NOTIFICATION_KEYS) {
    const pref = settings.notifications[key]
    ;(notifications as Record<string, Json>)[key] = {
      inApp: pref.inApp,
      email: pref.email,
    }
  }

  return {
    display_currency: settings.displayCurrency,
    language: settings.language,
    timezone: settings.timezone,
    time_format: settings.timeFormat,
    notifications,
    privacy_mode: settings.privacyMode,
    login_method: settings.loginMethod,
    has_password: settings.hasPassword,
  }
}

export function profileFromRow(
  row: Tables<"profiles">,
  socials: Tables<"social_links">[]
): UserProfile {
  return {
    id: row.id,
    username: row.username ?? "",
    name: row.name,
    email: row.email,
    avatarPath: row.avatar_path ?? undefined,
    avatarId: row.avatar_id ?? undefined,
    bio: row.bio ?? undefined,
    location: row.location ?? undefined,
    timezone: row.timezone ?? undefined,
    website: row.website ?? undefined,
    socials: socials
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((link) => ({
        id: link.id,
        platform: link.platform,
        url: link.url,
      })),
    createdAt: row.created_at.slice(0, 10),
  }
}

export function profileToRow(profile: UserProfile) {
  return {
    username: profile.username || null,
    name: profile.name,
    email: profile.email,
    avatar_path: profile.avatarPath ?? null,
    avatar_id: profile.avatarId ?? null,
    bio: profile.bio ?? null,
    location: profile.location ?? null,
    timezone: profile.timezone ?? null,
    website: profile.website ?? null,
  }
}
