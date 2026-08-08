import { AUTHOR } from "@/lib/contact"
import { cn } from "@/lib/utils"

/**
 * The maker's credit. Takes the accent colour and an underline on hover, and
 * opens his profile in a new tab — the reader is mid-page, not finished with
 * it.
 */
export function MadeBy({ className }: { className?: string }) {
  return (
    <a
      href={AUTHOR.url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "text-muted-foreground underline-offset-4 transition-colors duration-200",
        "hover:text-[var(--chart-2)] hover:underline",
        "focus-visible:text-[var(--chart-2)] focus-visible:underline",
        className
      )}
    >
      Made by {AUTHOR.name}
    </a>
  )
}
