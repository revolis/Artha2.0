import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

// Registry component with two local fixes: it forwards a ref (needed wherever
// Base UI renders it as a trigger) and it dims when disabled, which the
// original had no styling for.
export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border bg-background p-2 px-6 text-center text-sm font-semibold",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="size-2 rounded-full bg-primary transition-all duration-300 group-hover:scale-[100.8]" />
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight className="size-4" />
      </div>
    </button>
  )
})

InteractiveHoverButton.displayName = "InteractiveHoverButton"
