# Artha

A personal finance dashboard for tracking crypto, equities and cash income in
one place. Every figure can be shown in any of six currencies, with exchange
rates refreshed from a live feed.

Entries are recorded by hand — Artha does not connect to an exchange, a broker
or a bank, and asks for no keys or account access.

## What is in it

- **Dashboard** — portfolio value, monthly performance, a year heatmap
- **Entries** — profit, loss, fees, tax, transfers and P2P trades
- **Fiat/P2P** — cash trades with their own rate and a running position
- **Portfolio, Analytics, Reports** — totals, trends and exports
- **Goals** — targets with progress, deadlines and completion
- **Profile, Settings** — display currency, privacy mode, notifications

## Built with

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
shadcn/ui on [Base UI](https://base-ui.com) · Supabase (Postgres, Auth,
Storage) · visx and Recharts for the charts.

## Running it locally

Requires **Node 20+** and **pnpm**.

```bash
pnpm install
```

Copy the environment template and fill it in from your Supabase project
(Project Settings → API):

```bash
cp .env.example .env.local
```

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key |

Both are safe in the browser. The publishable key grants only what row-level
security allows, and every table is scoped to the signed-in user.

```bash
pnpm dev
```

Then open http://localhost:3000.

Other scripts: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format`.

## Database

The schema lives in Supabase rather than in this repo. Every table has row
level security enabled with a policy tying each row to `auth.uid()`, so a
signed-in user can reach their own data and nothing else.

Attachment images and profile photos are kept in two **private** Storage
buckets, one folder per user. Nothing is publicly readable — the app requests a
short-lived signed link when a picture is actually shown.

`supabase/email-templates/` holds the sign-up, password-reset and magic-link
emails. They are pasted into the Supabase dashboard under
Authentication → Email Templates; they are not applied automatically.

## Deploying

Any host that runs Next.js works. On Vercel:

1. Import this repository.
2. Add the two environment variables above.
3. Deploy — the framework and build command are detected automatically.

Then, in the Supabase dashboard under **Authentication → URL Configuration**,
add the deployed origin as the Site URL and add `<origin>/auth/callback` to the
redirect allow list. Sign-in links and OAuth will not return to the site until
that is done.

## Licence

No licence granted. All rights reserved.

---

Made by [RΛBIN](https://x.com/0xr8n)
