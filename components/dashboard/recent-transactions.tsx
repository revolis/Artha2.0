"use client"

import { useRouter } from "next/navigation"
import {
  Copy,
  MoreVertical,
  Paperclip,
  Pencil,
  Trash2,
} from "@/components/icons"

import { entryTypeLabels } from "@/components/entries/entry-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { normaliseAttachments } from "@/lib/attachments"
import { getCategoryIcon } from "@/lib/category-icons"
import { formatMoney, getNetAmount } from "@/lib/mock-data"
import { tagStyle } from "@/lib/tag-colors"
import type { Entry, Source } from "@/lib/types"
import { cn } from "@/lib/utils"

const RECENT_LIMIT = 5

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

// "Today, 10:24 AM" / "Yesterday" / "Oct 12" / "Oct 12, 2025"
function formatWhen(datetime: string, now = new Date()): string {
  const when = new Date(datetime)
  const dayDiff = Math.round((startOfDay(now) - startOfDay(when)) / 86_400_000)

  if (dayDiff === 0) {
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(when)
    return `Today, ${time}`
  }
  if (dayDiff === 1) return "Yesterday"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(when.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  }).format(when)
}

// The clock time, shown under the relative date so "Jun 30" still tells you
// when in the day it happened.
function formatExactTime(datetime: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(datetime))
}

interface RecentTransactionsProps {
  entries: Entry[]
  sources: Source[]
  onEdit: (entry: Entry) => void
  onDuplicate: (entry: Entry) => void
  onDelete: (entry: Entry) => void
}

export function RecentTransactions({
  entries,
  sources,
  onEdit,
  onDuplicate,
  onDelete,
}: RecentTransactionsProps) {
  const router = useRouter()
  const sourceById = new Map(sources.map((source) => [source.id, source.name]))
  const recent = [...entries]
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, RECENT_LIMIT)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest account activity.</CardDescription>
        <CardAction>
          {/* Navigates via the router: this button can't render as an anchor,
              and nesting one inside a Link would be invalid markup. */}
          <InteractiveHoverButton onClick={() => router.push("/entries")}>
            View All
          </InteractiveHoverButton>
        </CardAction>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No entries yet for this year.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {recent.map((entry) => {
              const sourceName = entry.sourceId
                ? sourceById.get(entry.sourceId)
                : undefined
              const title =
                entry.category ?? sourceName ?? entryTypeLabels[entry.type]
              // The type has its own badge now, so the source line is dropped
              // rather than repeated when it matches the title.
              const subtitle =
                sourceName && sourceName !== title ? sourceName : null
              const Icon = getCategoryIcon(entry.category ?? sourceName)
              const net = getNetAmount(entry)

              const attachments = normaliseAttachments(entry.attachments)

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{title}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {entryTypeLabels[entry.type]}
                      </Badge>
                    </div>

                    {/* Where it came from, plus its tags — each in its own
                        colour, the same one used on the Entries table. */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      {subtitle ? (
                        <span className="truncate">{subtitle}</span>
                      ) : null}
                      {entry.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="shrink-0 px-1.5 py-0 text-[10px]"
                          style={tagStyle(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {entry.tags.length > 2 ? (
                        <span className="text-xs">
                          +{entry.tags.length - 2}
                        </span>
                      ) : null}
                      {attachments.length > 0 ? (
                        <span className="flex shrink-0 items-center gap-0.5 text-xs">
                          <Paperclip className="size-3" />
                          {attachments.length}
                        </span>
                      ) : null}
                    </div>

                    {/* The rate and cash side of a P2P trade — the whole point
                        of the entry, and previously invisible here. */}
                    {entry.p2p ? (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {entry.p2p.direction === "usd-to-cash"
                          ? "Sold USD"
                          : "Bought USD"}
                        {" · "}
                        {entry.p2p.cashCurrency}{" "}
                        {entry.p2p.cashAmount.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                        {" @ "}
                        {entry.p2p.rate}
                      </span>
                    ) : null}

                    {entry.note ? (
                      <span className="line-clamp-1 text-xs text-muted-foreground/80">
                        {entry.note}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        net > 0 && "text-success",
                        net < 0 && "text-destructive"
                      )}
                    >
                      {net > 0 ? "+" : net < 0 ? "−" : ""}
                      {formatMoney(entry.amount, "USD")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatWhen(entry.datetime)}
                    </span>
                    <span className="text-[11px] text-muted-foreground/70">
                      {formatExactTime(entry.datetime)}
                    </span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Options for ${title}`}
                        />
                      }
                    >
                      <MoreVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => onEdit(entry)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(entry)}>
                          <Copy />
                          Duplicate
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(entry)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
