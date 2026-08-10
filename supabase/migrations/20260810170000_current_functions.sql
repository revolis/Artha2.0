-- Current definitions of the database functions, captured from the live
-- project on 2026-08-10.
--
-- These replace the earlier versions created in
-- 20260808091733_create_triggers_and_new_user_bootstrap.sql and rewritten
-- several times after it. `create or replace` throughout, so this file is safe
-- to run after the two before it.
--
-- notification_digest lives in its own file — it is long enough to be worth
-- reading on its own.

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Gives a new account its profile and settings row inside the same
-- transaction that creates the user.
--
-- resolved_email falls back to the provider's metadata: a Google sign-up
-- carries its address there, and auth.users.email is not always populated by
-- the moment this runs. Storing an empty string dropped such an account out of
-- notification_digest, which selects `where p.email <> ''`.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  base_username text;
  candidate text;
  suffix integer := 0;
  resolved_email text;
begin
  resolved_email := coalesce(
    new.email,
    new.raw_user_meta_data ->> 'email',
    ''
  );

  base_username := regexp_replace(
    lower(split_part(resolved_email, '@', 1)), '[^a-z0-9_]', '', 'g'
  );
  if base_username = '' then
    base_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  candidate := base_username;
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, name, email)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    resolved_email
  );

  insert into public.settings (user_id, login_method, has_password)
  values (
    new.id,
    case
      when new.raw_app_meta_data ->> 'provider' = 'google' then 'google'
      else 'password'
    end,
    coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'email'
  );

  return new;
end;
$function$;

-- Keeps profiles.email in step when the address on the account changes.
-- Attached to auth.users as on_auth_user_email_changed, AFTER UPDATE.
CREATE OR REPLACE FUNCTION public.sync_profile_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$function$;

-- Called by pg_cron. Reads the service role key out of Vault and asks the
-- send-notification-emails edge function to do the work, because sending mail
-- is not something a database should be doing itself.
CREATE OR REPLACE FUNCTION public.dispatch_notification_emails(kind text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  service_key text;
begin
  select decrypted_secret into service_key
  from vault.decrypted_secrets
  where name = 'service_role_key';

  if service_key is null then
    raise notice 'dispatch_notification_emails: no service_role_key in Vault yet, skipping';
    return;
  end if;

  perform net.http_post(
    url := 'https://vosxgtbaizimrbdoztir.supabase.co/functions/v1/send-notification-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('kind', kind),
    timeout_milliseconds := 30000
  );
end;
$function$;

-- Rebuilds the public demo account from a template account, nightly.
-- The identity stays the demo's own: a visitor should never see the real
-- account holder's name or address.
CREATE OR REPLACE FUNCTION public.reset_demo_account(template_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  demo_user constant uuid := 'd3300000-0000-4000-8000-000000000001';
begin
  if template_user = demo_user then
    raise exception 'template and demo account must differ';
  end if;

  -- Children first: entries reference sources, attachments reference entries.
  delete from public.entry_attachments where user_id = demo_user;
  delete from public.entries where user_id = demo_user;
  delete from public.goals where user_id = demo_user;
  delete from public.sources where user_id = demo_user;
  delete from public.dashboard_years where user_id = demo_user;
  delete from public.notification_reads where user_id = demo_user;

  insert into public.sources (user_id, name, social_handle, platform_url, campaign_url)
  select demo_user, name, social_handle, platform_url, campaign_url
  from public.sources where user_id = template_user;

  -- Sources are matched by name because their ids are freshly generated.
  insert into public.entries (
    user_id, occurred_at, type, category, tags, source_id, amount, note,
    p2p_direction, p2p_cash_currency, p2p_rate, p2p_cash_amount
  )
  select demo_user, e.occurred_at, e.type, e.category, e.tags, mine.id, e.amount,
         e.note, e.p2p_direction, e.p2p_cash_currency, e.p2p_rate, e.p2p_cash_amount
  from public.entries e
  left join public.sources theirs on theirs.id = e.source_id
  left join public.sources mine
    on mine.user_id = demo_user and mine.name = theirs.name
  where e.user_id = template_user;

  insert into public.goals (
    user_id, title, target_amount, current_amount, currency,
    start_date, end_date, completed_at, show_on_dashboard, track_category
  )
  select demo_user, title, target_amount, current_amount, currency,
         start_date, end_date, completed_at, show_on_dashboard, track_category
  from public.goals where user_id = template_user;

  insert into public.dashboard_years (user_id, year)
  select demo_user, year from public.dashboard_years where user_id = template_user
  on conflict do nothing;

  -- The identity is the demo's own, not the template's — a visitor should
  -- never see the real account's name or address.
  update public.profiles set
    name = 'Demo Account',
    username = 'demo',
    bio = 'A worked example of Artha, filled with three years of sample entries.',
    location = 'Kathmandu, Nepal',
    avatar_id = 'aurora',
    avatar_path = null,
    website = null
  where id = demo_user;

  update public.settings set
    display_currency = 'USD',
    privacy_mode = false,
    notifications = jsonb_set(
      jsonb_set(notifications, '{monthlyReport,email}', 'false'),
      '{weeklySummary,email}', 'false')
  where user_id = demo_user;
end;
$function$;
