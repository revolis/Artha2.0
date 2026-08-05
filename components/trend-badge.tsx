"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Uses lucide (the project's icon library) and the success theme token rather
// than the registry's @central-icons-react dependency and hardcoded emerald.
export function TrendBadge({
  value,
  className,
}: {
  value: number | null
  className?: string
}) {
  if (value === null || !Number.isFinite(value)) {
    return null
  }

  const positive = value >= 0

  return (
    <Badge
      className={cn(positive && "border-success/20 bg-success/10 text-success", className)}
      variant={positive ? "outline" : "destructive"}
    >
      {positive ? (
        <ArrowUp data-icon="inline-start" />
      ) : (
        <ArrowDown data-icon="inline-start" />
      )}
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </Badge>
  )
}
