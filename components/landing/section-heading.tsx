"use client"

import { Reveal } from "@/components/landing/reveal"
import { cn } from "@/lib/utils"

/** The eyebrow / title / description stack every section opens with. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string
  title: string
  description?: string
  align?: "center" | "left"
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-10",
        align === "center" ? "items-center text-center" : "items-start",
        className
      )}
    >
      <Reveal y={10}>
        <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={160}>
          <p
            className={cn(
              "max-w-2xl leading-relaxed text-balance text-muted-foreground",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  )
}
