"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  FileText,
  Megaphone,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Undo2,
} from "@/components/icons"

import { NavIconButton } from "@/components/layout/nav-icon-button"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  bucketOf,
  timeAgo,
  useNotifications,
  type AppNotification,
  type NotificationKind,
} from "@/lib/use-notifications"
import { useEntryData } from "@/lib/use-entry-data"
import { useGoals } from "@/lib/use-goals"
import { useRates } from "@/lib/use-rates"
import { useSettings } from "@/lib/use-settings"
import { cn } from "@/lib/utils"

const KIND_ICONS: Record<NotificationKind, typeof Bell> = {
  goal: Target,
  entry: TrendingUp,
  report: FileText,
  rate: CalendarClock,
  summary: Sparkles,
  news: Megaphone,
}

const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function NotificationRow({
  item,
  unread,
  onOpen,
  onToggleRead,
}: {
  item: AppNotification
  unread: boolean
  onOpen: () => void
  onToggleRead: () => void
}) {
  return (
    <div
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
        "hover:bg-accent"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-start gap-3 text-left outline-none"
      >
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 ease-out group-hover:scale-105",
            unread
              ? "border-transparent bg-primary/10 text-primary"
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          {/* createElement rather than a capitalised local: the icon is picked
              from a fixed map, not defined here. */}
          {React.createElement(KIND_ICONS[item.kind], { className: "size-4" })}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm",
                unread ? "font-medium" : "text-muted-foreground"
              )}
            >
              {item.title}
            </span>
            {unread ? (
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-primary"
              />
            ) : null}
          </span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            {item.body}
          </span>
          <span className="text-[11px] text-muted-foreground/70">
            {timeAgo(item.datetime)}
          </span>
        </span>
      </button>

      {/* Appears on hover so a row can be flipped back to unread. */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label={unread ? "Mark as read" : "Mark as unread"}
              onClick={onToggleRead}
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background hover:text-foreground focus-visible:opacity-100"
            />
          }
        >
          {unread ? (
            <CheckCheck className="size-3.5" />
          ) : (
            <Undo2 className="size-3.5" />
          )}
        </TooltipTrigger>
        <TooltipContent side="left">
          {unread ? "Mark as read" : "Mark as unread"}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export function NotificationsMenu() {
  const router = useRouter()
  const mounted = useMounted()
  const { goals } = useGoals()
  const { entries } = useEntryData()
  const { settings } = useSettings()
  const { updatedAt, source } = useRates()
  const {
    notifications,
    readSet,
    unreadCount,
    markAllRead,
    markRead,
    markUnread,
  } = useNotifications(goals, entries, settings, updatedAt, source === "live")

  const [open, setOpen] = React.useState(false)
  const [unreadOnly, setUnreadOnly] = React.useState(false)

  const visible = unreadOnly
    ? notifications.filter((item) => !readSet.has(item.id))
    : notifications

  // Grouped by age so a long list still reads at a glance.
  const groups = React.useMemo(() => {
    const out: { bucket: string; items: AppNotification[] }[] = []
    for (const item of visible) {
      const bucket = bucketOf(item.datetime)
      const last = out[out.length - 1]
      if (last && last.bucket === bucket) last.items.push(item)
      else out.push({ bucket, items: [item] })
    }
    return out
  }, [visible])

  function openItem(id: string, href: string) {
    markRead(id)
    setOpen(false)
    router.push(href)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <NavIconButton
            label="Notifications"
            // Read state only exists on the client, so the dot waits for mount.
            showDot={mounted && unreadCount > 0}
          >
            <Bell />
          </NavIconButton>
        }
      />
      {/* Fixed max height with the list as the only scrolling part, so the
          header and footer stay put and nothing spills past the panel. */}
      <PopoverContent
        align="end"
        className="flex max-h-[min(30rem,calc(100vh-5rem))] w-[22rem] flex-col overflow-hidden p-0"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Notifications</span>
            <span className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </span>
          </div>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
          {[
            { label: "All", value: false, count: notifications.length },
            { label: "Unread", value: true, count: unreadCount },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setUnreadOnly(tab.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                unreadOnly === tab.value
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className="ml-1 tabular-nums opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <BellOff className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {unreadOnly
                  ? "Nothing unread."
                  : "Nothing to show. Turn categories back on in Settings."}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.bucket}>
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  {group.bucket}
                </div>
                {group.items.map((item) => {
                  const unread = !readSet.has(item.id)
                  return (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      unread={unread}
                      onOpen={() => openItem(item.id, item.href)}
                      onToggleRead={() =>
                        unread ? markRead(item.id) : markUnread(item.id)
                      }
                    />
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 border-t p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false)
              router.push("/settings")
            }}
          >
            <Settings2 data-icon="inline-start" />
            Notification settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
