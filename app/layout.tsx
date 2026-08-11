import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { SiteBackground } from "@/components/layout/site-background"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "ARTHA — Take Control of Your Financial Future",
    template: "%s — ARTHA",
  },
  description: "Take Control of Your Financial Future",
  // No `icons` here on purpose. Naming one file overrode the rest, which is
  // how the tab kept showing an icon.ico left over from the first week while
  // the app itself drew a different mark everywhere else. Next picks up
  // app/icon.svg, app/favicon.ico and app/apple-icon.png from their filenames
  // and emits a link for each, so the three cannot drift apart again.
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <SiteBackground />
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
