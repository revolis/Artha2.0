# Database migrations

The schema lives in Supabase. This folder is the copy that lives with the code,
so the database is not the only place it exists.

## What is here

| File | What it creates |
| ---- | --------------- |
| `20260808091707_create_core_schema.sql` | Every table, index, constraint and RLS policy: profiles, social links, settings, sources, entries, entry attachments, goals, dashboard years, notification reads |
| `20260808091733_create_triggers_and_new_user_bootstrap.sql` | `touch_updated_at`, and `handle_new_user` — the trigger that gives a new account its profile and settings row inside the same transaction that creates the user |
| `20260810170000_current_functions.sql` | `touch_updated_at`, `handle_new_user`, `sync_profile_email`, `dispatch_notification_emails`, `reset_demo_account`, as they stand today |
| `20260810170100_current_notification_digest.sql` | `notification_digest` — every figure in the monthly statement comes out of this one query |
| `20260810170200_schema_deltas_since_core.sql` | Everything added after the core schema: the `messages` and `fx_rates` tables, goal category tracking, the move of attachments and avatars to Storage, `auth.uid()` defaults, the storage buckets and their policies, the three cron jobs, the email-sync trigger, and the execute revokes |

Together these five describe the database as it stands. They are not the
original history — see below.

## Why these are a snapshot rather than the history

There were twenty-six migrations. `supabase link` reconciles the remote
migration history against this folder, and at the time this folder held two
files, so the other twenty-four bookkeeping rows were removed from
`supabase_migrations.schema_migrations`. The schema itself was untouched — no
table, function, policy, job or row was affected — but the SQL text of those
migrations lived only in that table and is gone.

What matters for rebuilding is the state, not the path taken to it, so the
state is what is recorded here: definitions read straight out of the live
project with `pg_get_functiondef` and the catalogue views.

## Rebuilding from these

Run them in filename order against a fresh project. The later files are
idempotent (`create or replace`, `if not exists`, `if exists`), so they are
also safe to re-run against a database that already has some of it.

Two things live outside this folder and are needed as well:

- `supabase/functions` — the four edge functions, with a README covering the
  per-function `verify_jwt` setting, which is deployment configuration rather
  than code.
- The Vault secret named `service_role_key`, which
  `dispatch_notification_emails` reads in order to call the mail function.
  Secrets are deliberately not in the repo.

## Keeping it current

After changing the schema, capture the change here as well. The CLI can do it
in one command once Docker Desktop is installed:

```bash
pnpm dlx supabase@latest db pull
```

Without Docker, `db pull` and `db dump` both fail — they run `pg_dump` inside a
container — and the schema has to be read out of the project by hand, as it was
here.
