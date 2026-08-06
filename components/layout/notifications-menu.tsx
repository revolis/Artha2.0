"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  BellOff,
  CalendarClock,
  FileText,
  Settings2,
  Target,
  TrendingUp,
} from "lucide-react"

import { NavIconButton } from "@/components/layout/nav-icon-button"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  timeAgo,
  useNotifications,
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
}

const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function NotificationsMenu() {
  const router = useRouter()
  const mounted = useMounted()
  const { goals } = useGoals()
  const { entries } = useEntryData()
  const { settings } = useSettings()
  const { updatedAt } = useRates()
  const { notifications, readSet, unreadCount, markAllRead, markRead } =
    useNotifications(goals, entries, settings, updatedAt)
  const [open, setOpen] = React.useState(false)

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
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
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

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <BellOff className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nothing to show. Turn categories back on in Settings.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="flex flex-col p-1">
              {notifications.map((item) => {
                const unread = !readSet.has(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item.id, item.href)}
                    className="group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 ease-out group-hover:scale-105",
                        unread
                          ? "border-transparent bg-primary/10 text-primary"
                          : "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {/* createElement rather than a capitalised local: the
                          icon is picked from a fixed map, not defined here. */}
                      {React.createElement(KIND_ICONS[item.kind], {
                        className: "size-4",
                      })}
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
                )
              })}
            </div>
          </ScrollArea>
        )}

        <div className="border-t p-1">
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
