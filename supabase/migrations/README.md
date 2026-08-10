# Database migrations

The schema lives in Supabase. This folder is the copy that lives with the code,
so the database is not the only place it exists.

## What is here

| File | What it creates |
| ---- | --------------- |
| `20260808091707_create_core_schema.sql` | Every table, index, constraint and RLS policy: profiles, social links, settings, sources, entries, entry attachments, goals, dashboard years, notification reads |
| `20260808091733_create_triggers_and_new_user_bootstrap.sql` | `touch_updated_at`, and `handle_new_user` — the trigger that gives a new account its profile and settings row inside the same transaction that creates the user |

Those two are the foundation: between them they describe the shape of the
database and how an account comes into being.

## What is not here yet

Twenty-four later migrations are still only in Supabase. They are recorded in
`supabase_migrations.schema_migrations` on the project and can be listed with:

```bash
pnpm dlx supabase@latest migration list
```

They cover, in order: permission tightening on the trigger functions,
`default auth.uid()` on user_id columns, moving attachments and avatars to
Storage, the email sync trigger, the messages table, pg_cron and pg_net,
`notification_digest` and its scheduling, the notification defaults, goal
category tracking, the `fx_rates` table, the richer digest and goal
contribution figures, the demo account reset and its schedule, an index on
`messages.user_id`, and filling a blank profile email from the provider.

## Completing the copy

The whole current schema can be pulled into this folder in one command, which
is more reliable than transcribing the history by hand:

```bash
pnpm dlx supabase@latest link --project-ref vosxgtbaizimrbdoztir
```

```bash
pnpm dlx supabase@latest db pull
```

`link` asks for the database password — the one under **Project Settings →
Database** in the Supabase dashboard, not the account password. `db pull` then
writes the live schema as a migration alongside these.

## Why this matters

Losing the Supabase project would otherwise lose the schema with it. The edge
functions were committed for the same reason and live in `supabase/functions`.
The row-level security policies in particular are not something anyone would
reconstruct correctly from memory, and they are the only thing standing
between one account's ledger and another's.
