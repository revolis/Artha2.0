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

## Edge functions

Four, all deployed to Supabase rather than Vercel, because each needs a key
that must not reach a browser. The source lives in `supabase/functions/`, and
that directory's README covers deployment — including which of them run with
JWT verification off, which is configuration rather than code and so cannot be
read from the files.

| Function | Called by | Why it is server-side |
| --- | --- | --- |
| `delete-account` | The Danger zone in Settings | Deleting a user needs the service role key. It only ever deletes the caller — the id comes from their own verified token, never the request. |
| `send-message` | Contact and feedback forms | Holds the mail provider's key. The only endpoint open to signed-out visitors, so it validates its input and caps messages per address and per hour. |
| `send-notification-emails` | `pg_cron`, weekly and monthly | Reads every subscriber's address, so it stays behind a service-role call. |
| `refresh-rates` | Vercel Cron and a GitHub Action, daily | Writes the shared rate table, and the call is what keeps a free project from being paused for inactivity. |

### Outbound email

Account email (sign-up, password, address changes) goes through the SMTP
settings under Authentication. Everything else — contact, feedback, summaries —
goes through the Resend API and needs one secret:

```bash
supabase secrets set RESEND_API_KEY=re_your_key
```

Optionally `MESSAGES_FROM` (default `Artha <noreply@0xr8n.me>`) and
`MESSAGES_TO` (where contact mail lands).

Without the key nothing breaks: messages are still stored in the `messages`
table and the summary job reports that it sent nothing.

### Scheduled email

`pg_cron` runs the weekly summary on Mondays at 08:00 UTC and the monthly
report on the 1st at 08:05 UTC. Both call `send-notification-emails`, which
needs a service role key — read from Vault at run time rather than written into
the schedule, where anyone able to read `cron.job` could read the key:

```sql
select vault.create_secret('<service role key>', 'service_role_key');
```

Until that secret exists the job runs and quietly does nothing.

## The live demo

The Live demo buttons point at `/demo`, which signs the visitor into a shared
demo account and sends them to the dashboard. They see three years of sample
entries, real charts and every page working — without signing up.

The credentials in `lib/demo.ts` are public on purpose; the account exists to
be signed into by strangers. It is deliberately not a personal account, so
nobody's real address appears in the sidebar. Two things keep it usable:

- `delete-account` refuses that one user id, so a visitor cannot take the demo
  down from the Danger zone.
- `reset_demo_account()` runs nightly at 03:00 UTC and copies the ledger back
  from the template account, so one visitor's edits do not greet the next.

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
