import Link from "next/link"

import { ArthaMark } from "@/components/layout/artha-mark"

/**
 * The frame every auth screen sits in: the mark, a titled panel, and a line of
 * small print beneath it. No background of its own — the site-wide star field
 * shows through the gutters.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-5 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <ArthaMark className="size-7" />
          <span className="text-base font-semibold tracking-[0.14em]">
            ARTHA
          </span>
        </Link>

        <div className="flex flex-col gap-6 rounded-2xl border bg-card/60 p-6 backdrop-blur-[2px] sm:p-7">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          {children}
        </div>

        {footer ? (
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        ) : null}
      </div>
    </main>
  )
}
