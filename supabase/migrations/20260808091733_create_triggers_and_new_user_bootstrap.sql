-- Keeps updated_at honest without the client having to remember.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger settings_touch_updated_at before update on public.settings
  for each row execute function public.touch_updated_at();
create trigger entries_touch_updated_at before update on public.entries
  for each row execute function public.touch_updated_at();
create trigger goals_touch_updated_at before update on public.goals
  for each row execute function public.touch_updated_at();

-- A new account needs a profile and a settings row before the app can render
-- anything. Doing it here rather than in the client means it happens exactly
-- once, inside the same transaction that creates the user, whichever way they
-- signed up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
  candidate text;
  suffix integer := 0;
begin
  -- Start from the email local part, fall back to the id.
  base_username := regexp_replace(
    lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'
  );
  if base_username = '' then
    base_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  candidate := base_username;
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, name, email, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url'
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
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
