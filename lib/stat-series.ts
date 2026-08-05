// Buckets entries into chart points for the stat cards. Each card supplies its
// own reducer, so sums, counts and weighted averages all use the same plumbing.

import type { Entry } from "@/lib/types"

export interface StatPoint {
  // Index signature so the array satisfies the chart's Record<string, unknown>.
  [key: string]: Date | number
  date: Date
  value: number
}

export interface StatBucket {
  date: Date
  entries: Entry[]
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Empty buckets from `from` to `to`, so quiet periods still show as zero. */
function emptyBuckets(
  from: Date,
  to: Date,
  granularity: "month" | "day"
): StatBucket[] {
  const buckets: StatBucket[] = []
  const cursor =
    granularity === "month" ? startOfMonth(from) : startOfDay(from)
  const end = granularity === "month" ? startOfMonth(to) : startOfDay(to)

  while (cursor <= end) {
    buckets.push({ date: new Date(cursor), entries: [] })
    if (granularity === "month") {
      cursor.setMonth(cursor.getMonth() + 1)
    } else {
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return buckets
}

export function bucketEntries(
  entries: Entry[],
  from: Date,
  to: Date,
  granularity: "month" | "day"
): StatBucket[] {
  const buckets = emptyBuckets(from, to, granularity)
  const indexOf = new Map<string, number>()
  buckets.forEach((bucket, index) => {
    const key =
      granularity === "month"
        ? bucket.date.toISOString().slice(0, 7)
        : bucket.date.toISOString().slice(0, 10)
    indexOf.set(key, index)
  })

  for (const entry of entries) {
    const key =
      granularity === "month"
        ? entry.datetime.slice(0, 7)
        : entry.datetime.slice(0, 10)
    const index = indexOf.get(key)
    if (index !== undefined) buckets[index].entries.push(entry)
  }
  return buckets
}

/** Months of a year, stopping at the current month for the ongoing year. */
export function monthBucketsForYear(
  entries: Entry[],
  year: number,
  now = new Date()
): StatBucket[] {
  const from = new Date(year, 0, 1)
  const to =
    year === now.getFullYear() ? new Date(year, now.getMonth(), 1) : new Date(year, 11, 1)
  const inYear = entries.filter(
    (entry) => Number(entry.datetime.slice(0, 4)) === year
  )
  return bucketEntries(inYear, from, to, "month")
}

/**
 * Buckets a pre-filtered set by month, dropping to days when the range covers
 * less than two months — a single-point chart tells you nothing.
 */
export function autoBuckets(entries: Entry[], now = new Date()): StatBucket[] {
  if (entries.length === 0) return []
  const times = entries.map((entry) => new Date(entry.datetime).getTime())
  const from = new Date(Math.min(...times))
  const to = new Date(Math.max(...times, now.getTime() - 0))

  const monthSpan =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())

  return monthSpan >= 2
    ? bucketEntries(entries, from, to, "month")
    : bucketEntries(entries, from, to, "day")
}

export function toStatPoints(
  buckets: StatBucket[],
  reduce: (entries: Entry[]) => number,
  options: { cumulative?: boolean } = {}
): StatPoint[] {
  let running = 0
  return buckets.map((bucket) => {
    const value = reduce(bucket.entries)
    running += value
    return { date: bucket.date, value: options.cumulative ? running : value }
  })
}

/** Percent change between the last two points that carried any value. */
export function trendOf(points: StatPoint[]): number | null {
  const active = points.filter((point) => point.value !== 0)
  if (active.length < 2) return null
  const latest = active[active.length - 1].value
  const previous = active[active.length - 2].value
  if (previous === 0) return null
  return ((latest - previous) / Math.abs(previous)) * 100
}
