"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileDown, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const HOLD_MS = 4000

interface DeleteYearDialogProps {
  year: number | null
  entryCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (year: number) => void
}

export function DeleteYearDialog({
  year,
  entryCount,
  open,
  onOpenChange,
  onConfirm,
}: DeleteYearDialogProps) {
  const router = useRouter()
  const [progress, setProgress] = React.useState(0)
  const timerRef = React.useRef<number | null>(null)
  const startedRef = React.useRef(0)

  const stopHold = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setProgress(0)
  }, [])

  // Cancel any in-flight hold if the dialog closes mid-press.
  React.useEffect(() => stopHold, [stopHold])

  // Driven by a timer rather than requestAnimationFrame: progress here is
  // elapsed time, not an animation, and rAF stalls whenever the page isn't
  // painting — which would leave the hold impossible to complete.
  function startHold() {
    if (year === null || timerRef.current !== null) return
    startedRef.current = Date.now()

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedRef.current
      const next = Math.min(1, elapsed / HOLD_MS)
      setProgress(next)

      if (next >= 1) {
        stopHold()
        onConfirm(year)
        onOpenChange(false)
      }
    }, 50)
  }

  const secondsLeft = Math.ceil((HOLD_MS * (1 - progress)) / 1000)
  const holding = progress > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) stopHold()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-destructive" />
            Delete {year}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes {entryCount}{" "}
            {entryCount === 1 ? "entry" : "entries"} dated in {year}, along with
            the year itself. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-2xl border p-4">
          <p className="text-sm font-medium">Export it first?</p>
          <p className="text-sm text-muted-foreground">
            Save a copy of everything in {year} before it goes. This opens
            Reports with a full export of {year} already selected.
          </p>
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => router.push(`/reports?year=${year}&scope=all`)}
          >
            <FileDown data-icon="inline-start" />
            Export {year} data
          </Button>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {/* Hold rather than click: a single misclick shouldn't wipe a year. */}
          <button
            type="button"
            disabled={year === null}
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            className={cn(
              "relative w-full overflow-hidden rounded-full border border-destructive/40 px-4 py-2.5",
              "text-sm font-medium text-destructive transition-colors select-none",
              "hover:bg-destructive/5 disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 bg-destructive/20"
              style={{ width: `${progress * 100}%` }}
            />
            <span className="relative">
              {holding
                ? `Keep holding… ${secondsLeft}s`
                : `Hold 4s to delete ${year}`}
            </span>
          </button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
