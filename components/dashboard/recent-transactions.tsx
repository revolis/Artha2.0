"use client"

import { useRouter } from "next/navigation"
import { Copy, MoreVertical, Pencil, Trash2 } from "@/components/icons"

import { entryTypeLabels } from "@/components/entries/entry-form-dialog"
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
import { getCategoryIcon } from "@/lib/category-icons"
import { formatMoney, getNetAmount } from "@/lib/mock-data"
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
              // Avoid repeating the title when a source shares the category name.
              const subtitle =
                sourceName && sourceName !== title
                  ? sourceName
                  : entryTypeLabels[entry.type]
              const Icon = getCategoryIcon(entry.category ?? sourceName)
              const net = getNetAmount(entry)

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{title}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {subtitle}
                    </span>
                  </div>

                  <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">
                    {formatWhen(entry.datetime)}
                  </span>

                  <span
                    className={cn(
                      "shrink-0 font-semibold tabular-nums",
                      net > 0 && "text-success",
                      net < 0 && "text-destructive"
                    )}
                  >
                    {net > 0 ? "+" : net < 0 ? "−" : ""}
                    {formatMoney(entry.amount, "USD")}
                  </span>

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
