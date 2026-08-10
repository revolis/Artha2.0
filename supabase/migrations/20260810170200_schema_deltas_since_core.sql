-- Everything the schema gained after the core migration, captured from the
-- live project on 2026-08-10 and written as one file.
--
-- Idempotent throughout (`if not exists` / `if exists`), so it is safe to run
-- against a database that already has some of it.

-- ---------------------------------------------------------------- messages --
-- Contact and feedback submissions. Written only by the send-message edge
-- function using the service role, which is why RLS is enabled with no policy
-- at all: nothing reaching the API may read or write it.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  source text not null check (source in ('contact','feedback')),
  topic text not null,
  reply_to text not null,
  subject text,
  body text not null,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index if not exists messages_user_id_idx on public.messages (user_id);

-- ---------------------------------------------------------------- fx_rates --
-- One row per day of exchange rates, written by the refresh-rates edge
-- function. Readable by anyone: it is public market data, and the app needs it
-- to convert amounts before anyone signs in.
create table if not exists public.fx_rates (
  as_of date primary key,
  rates jsonb not null,
  source text not null default 'live',
  fetched_at timestamptz not null default now()
);
alter table public.fx_rates enable row level security;
drop policy if exists "rates are readable by anyone" on public.fx_rates;
create policy "rates are readable by anyone" on public.fx_rates
  for select to anon, authenticated using (true);

-- ------------------------------------------------------- later column work --
-- Goals can follow a single category rather than the net result.
alter table public.goals add column if not exists track_category text;

-- Attachments and avatars moved to Storage; the data URL columns went with it.
alter table public.entry_attachments add column if not exists storage_path text;
alter table public.entry_attachments drop column if exists data_url;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles drop column if exists avatar_url;

-- Two-factor was a switch nothing ever read. A column full of false is what
-- someone later mistakes for a feature that is merely switched off.
alter table public.settings drop column if exists two_factor;

create index if not exists entry_attachments_user_id_idx
  on public.entry_attachments (user_id);

-- user_id defaults to the caller, so an insert cannot forget it and the RLS
-- check has something to match against.
alter table public.entries            alter column user_id set default auth.uid();
alter table public.sources            alter column user_id set default auth.uid();
alter table public.goals              alter column user_id set default auth.uid();
alter table public.settings           alter column user_id set default auth.uid();
alter table public.social_links       alter column user_id set default auth.uid();
alter table public.entry_attachments  alter column user_id set default auth.uid();
alter table public.dashboard_years    alter column user_id set default auth.uid();
alter table public.notification_reads alter column user_id set default auth.uid();

-- ---------------------------------------------------------------- storage --
-- Both private. Files are reached through signed URLs, never by public path.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('entry-attachments', 'entry-attachments', false, 5242880),
  ('avatars',           'avatars',           false, 2097152)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- Each user owns the folder named after their id.
drop policy if exists "own folder in entry-attachments" on storage.objects;
create policy "own folder in entry-attachments" on storage.objects
  for all to authenticated
  using (bucket_id = 'entry-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'entry-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own folder in avatars" on storage.objects;
create policy "own folder in avatars" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ------------------------------------------------------------- scheduling --
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The email jobs call dispatch_notification_emails, which reads the service
-- role key out of Vault. The demo reset rebuilds the public demo account from
-- the owner's, nightly.
select cron.unschedule('artha-weekly-summary') where exists
  (select 1 from cron.job where jobname = 'artha-weekly-summary');
select cron.schedule('artha-weekly-summary', '0 8 * * 1',
  $$select public.dispatch_notification_emails('weekly')$$);

select cron.unschedule('artha-monthly-report') where exists
  (select 1 from cron.job where jobname = 'artha-monthly-report');
select cron.schedule('artha-monthly-report', '5 8 1 * *',
  $$select public.dispatch_notification_emails('monthly')$$);

select cron.unschedule('artha-demo-reset') where exists
  (select 1 from cron.job where jobname = 'artha-demo-reset');
select cron.schedule('artha-demo-reset', '0 3 * * *',
  $$select public.reset_demo_account('931f55d0-e52e-4700-9f7e-6c88de595139')$$);

-- ------------------------------------------------------------- email sync --
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update on auth.users
  for each row execute function public.sync_profile_email();

-- Trigger functions are called by the database, never by a client.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_profile_email() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.reset_demo_account(uuid) from public, anon, authenticated;
revoke execute on function public.dispatch_notification_emails(text) from public, anon, authenticated;
