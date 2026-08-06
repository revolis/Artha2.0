# Artha — rules for every session

Personal finance dashboard (crypto, stocks, cash income — manual entry only,
totals in NPR and USD). Full spec and data shapes: see `SPEC.md`.

## The owner

Not a programmer. Builds by describing what they want in plain English.
**Explain things simply, and say what you're about to do before doing it.**
Avoid jargon in explanations.

## Hard rules

1. **Design first, functionality later.** Build every page with mock data only.
   No database, no auth, no API calls until the owner explicitly says so.
   _Exception, approved:_ exchange rates are fetched live from a public feed
   (`lib/use-rates.ts`). That is the only network call in the project —
   everything else is still local mock data.
2. **One page per session.** Never touch pages that aren't the subject of the
   current session.
3. **Use shadcn components via the CLI** — `pnpm dlx shadcn@latest add <name>`.
   Don't hand-write components that already exist in the registry. The shadcn
   agent skill is installed at `.agents/skills/shadcn` — use it.
4. **Theme tokens only**: `bg-background`, `text-foreground`, `bg-card`,
   `text-muted-foreground`, `border-border`, `chart-1`…`chart-5`, etc.
   Never hardcode colors (`bg-zinc-900`, hex values) in components.
5. **Ask before** installing any heavy dependency or changing project structure.
6. **Commit to git** after each working step.
7. Keep mock data conforming to the shapes in `SPEC.md` (put mock data in
   `lib/mock-data.ts` so it's swappable for a real backend later).

## Project facts

- Package manager: **pnpm** (not npm).
- Next.js 16 App Router — this version has breaking changes vs. training data;
  read `node_modules/next/dist/docs/` before writing Next-specific code
  (see `AGENTS.md`).
- Tailwind **v4** (CSS-based config in `app/globals.css`, no tailwind.config).
- shadcn style is **base-luma**, built on **Base UI** (`@base-ui/react`), not
  Radix. Component APIs may differ from classic shadcn — check with the shadcn
  skill / `pnpm dlx shadcn@latest docs <component>` when unsure.
- Icons: lucide-react. Dark mode: next-themes via `components/theme-provider.tsx`.
- Useful checks: `pnpm typecheck`, `pnpm lint`, `pnpm format`.
