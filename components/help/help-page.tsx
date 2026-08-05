"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Calculator,
  Database,
  MessageSquare,
  Search,
  Target,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { HELP_CATEGORIES } from "@/lib/help-content"

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  "getting-started": BookOpen,
  "money-maths": Calculator,
  planning: Target,
  data: Database,
}

export function HelpPage() {
  const router = useRouter()
  const [search, setSearch] = React.useState("")

  const query = search.trim().toLowerCase()
  const categories = React.useMemo(() => {
    if (!query) return HELP_CATEGORIES
    return HELP_CATEGORIES.map((category) => ({
      ...category,
      articles: category.articles.filter(
        (article) =>
          article.q.toLowerCase().includes(query) ||
          article.a.toLowerCase().includes(query)
      ),
    })).filter((category) => category.articles.length > 0)
  }, [query])

  const matchCount = categories.reduce(
    (total, category) => total + category.articles.length,
    0
  )

  return (
    <AppShell>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Support
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Help Centre</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <h2 className="text-lg font-medium">What can we help with?</h2>
          <InputGroup className="max-w-md">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search help articles…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
          <p className="text-sm text-muted-foreground">
            {query
              ? `${matchCount} ${matchCount === 1 ? "article" : "articles"} matching “${search.trim()}”`
              : `${HELP_CATEGORIES.reduce((n, c) => n + c.articles.length, 0)} articles across ${HELP_CATEGORIES.length} topics`}
          </p>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>Nothing matched that</EmptyTitle>
            <EmptyDescription>
              Try a different word, or ask us directly.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] ?? BookOpen
            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-4" />
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Keyed on the query so a filtered list opens its first
                      remaining result rather than staying collapsed. */}
                  <Accordion
                    key={query}
                    defaultValue={query ? [category.articles[0].q] : []}
                    multiple
                  >
                    {category.articles.map((article) => (
                      <AccordionItem key={article.q} value={article.q}>
                        <AccordionTrigger>{article.q}</AccordionTrigger>
                        <AccordionContent>{article.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
              <MessageSquare className="size-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                Didn&apos;t find your answer?
              </span>
              <span className="text-sm text-muted-foreground">
                Send us the details and we&apos;ll get back to you.
              </span>
            </div>
          </div>
          <Button onClick={() => router.push("/contact")}>Contact us</Button>
        </CardContent>
      </Card>
    </AppShell>
  )
}
