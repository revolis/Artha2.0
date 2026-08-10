-- Artha core schema. Every table is scoped to a user and protected by RLS;
-- there is no shared or public data in this application.

-- ---------------------------------------------------------------- profiles --
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  name text not null default '',
  email text not null default '',
  avatar_url text,
  avatar_id text,
  bio text,
  location text,
  timezone text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index social_links_user_id_idx on public.social_links (user_id);

-- ---------------------------------------------------------------- settings --
-- One row per user. Mirrors AppSettings in lib/types.ts.
create table public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_currency text not null default 'USD'
    check (display_currency in ('USD','NPR','INR','EUR','GBP','AED')),
  language text not null default 'en',
  timezone text not null default 'Asia/Kathmandu',
  time_format text not null default '12h' check (time_format in ('12h','24h')),
  notifications jsonb not null default '{
    "goalMilestones": {"inApp": true,  "email": true},
    "weeklySummary":  {"inApp": true,  "email": false},
    "monthlyReport":  {"inApp": true,  "email": true},
    "largeEntries":   {"inApp": true,  "email": false},
    "rateSync":       {"inApp": false, "email": false},
    "productNews":    {"inApp": false, "email": false}
  }'::jsonb,
  privacy_mode boolean not null default false,
  login_method text not null default 'password'
    check (login_method in ('google','password')),
  has_password boolean not null default true,
  two_factor boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- sources --
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  social_handle text,
  platform_url text,
  campaign_url text,
  created_at timestamptz not null default now()
);
create index sources_user_id_idx on public.sources (user_id);

-- ----------------------------------------------------------------- entries --
-- `occurred_at` is a naive timestamp on purpose. The app reads the year, month
-- and day by slicing the string, and a timezone-aware value would shift the
-- date for anyone east or west of the server.
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamp not null,
  type text not null check (type in ('profit','loss','p2p','fee','tax','transfer')),
  category text,
  tags text[] not null default '{}',
  source_id uuid references public.sources (id) on delete set null,
  amount numeric(18,2) not null check (amount >= 0),
  note text,

  -- Only present on type = 'p2p', enforced below.
  p2p_direction text check (p2p_direction in ('usd-to-cash','cash-to-usd')),
  p2p_cash_currency text,
  p2p_rate numeric(18,6) check (p2p_rate is null or p2p_rate > 0),
  p2p_cash_amount numeric(18,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- All four P2P columns travel together, and only on a P2P entry.
  constraint entries_p2p_complete check (
    (type = 'p2p') = (p2p_direction is not null)
    and (p2p_direction is null) = (p2p_cash_currency is null)
    and (p2p_direction is null) = (p2p_rate is null)
    and (p2p_direction is null) = (p2p_cash_amount is null)
  )
);
create index entries_user_occurred_idx on public.entries (user_id, occurred_at desc);
create index entries_user_type_idx on public.entries (user_id, type);
create index entries_source_id_idx on public.entries (source_id);

create table public.entry_attachments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  -- Downscaled JPEG as a data URL, matching what the client already produces.
  -- Moving these to Supabase Storage is the follow-up.
  data_url text,
  created_at timestamptz not null default now()
);
create index entry_attachments_entry_id_idx on public.entry_attachments (entry_id);

-- ------------------------------------------------------------------- goals --
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  target_amount numeric(18,2) not null check (target_amount >= 0),
  current_amount numeric(18,2) not null default 0,
  currency text not null default 'USD'
    check (currency in ('USD','NPR','INR','EUR','GBP','AED')),
  start_date date,
  end_date date,
  completed_at date,
  show_on_dashboard boolean not null default false,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_dates_ordered check (
    start_date is null or end_date is null or start_date <= end_date
  )
);
create index goals_user_id_idx on public.goals (user_id);

-- --------------------------------------------------------- dashboard years --
-- Years opened by hand that hold no entries yet. Years with entries appear on
-- their own, so only the empty ones need remembering.
create table public.dashboard_years (
  user_id uuid not null references auth.users (id) on delete cascade,
  year integer not null check (year between 1900 and 2200),
  created_at timestamptz not null default now(),
  primary key (user_id, year)
);

-- ------------------------------------------------------- notification reads --
create table public.notification_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

-- --------------------------------------------------------------------- RLS --
alter table public.profiles            enable row level security;
alter table public.social_links        enable row level security;
alter table public.settings            enable row level security;
alter table public.sources             enable row level security;
alter table public.entries             enable row level security;
alter table public.entry_attachments   enable row level security;
alter table public.goals               enable row level security;
alter table public.dashboard_years     enable row level security;
alter table public.notification_reads  enable row level security;

-- profiles key on id; every other table on user_id.
create policy "profiles are self-service" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "social links are self-service" on public.social_links
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "settings are self-service" on public.settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sources are self-service" on public.sources
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "entries are self-service" on public.entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "attachments are self-service" on public.entry_attachments
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "goals are self-service" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dashboard years are self-service" on public.dashboard_years
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "notification reads are self-service" on public.notification_reads
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
