"use client"

import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Shared look and hover motion for every icon in the header: the button lifts,
 * a soft pill fades in behind it, and the glyph scales up.
 */
export const navIconClass = cn(
  "group relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
  "text-muted-foreground outline-none",
  "transition-[color,background-color,transform,box-shadow] duration-300 ease-out",
  "hover:-translate-y-0.5 hover:bg-accent hover:text-foreground hover:shadow-sm",
  "active:translate-y-0 active:scale-95",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "data-popup-open:bg-accent data-popup-open:text-foreground",
  "[&_svg]:size-[18px] [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-out",
  "hover:[&_svg]:scale-110"
)

interface NavIconButtonProps extends React.ComponentProps<"button"> {
  label: string
  /** Small dot in the top-right corner, e.g. unread notifications. */
  showDot?: boolean
}

export function NavIconButton({
  label,
  showDot,
  className,
  children,
  ...props
}: NavIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(navIconClass, className)}
            {...props}
          />
        }
      >
        {children}
        {showDot ? (
          <span aria-hidden className="absolute top-1.5 right-1.5 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary ring-2 ring-background" />
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
