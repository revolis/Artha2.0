-- Works out who has asked for a summary email and what it should say.
-- Captured from the live project on 2026-08-10.
--
-- The arithmetic lives here rather than in the edge function so it sits next
-- to the entries it is counting. The function returns one row per subscriber
-- with an entry in the period; the edge function turns each row into an email.
--
-- Note `p.email <> ''`: an account whose profile email is blank is skipped
-- entirely. That is why handle_new_user falls back to the provider's metadata
-- rather than storing an empty string.

CREATE OR REPLACE FUNCTION public.notification_digest(kind text)
 RETURNS TABLE(user_id uuid, email text, display_name text, entry_count bigint, net numeric, income numeric, outgoings numeric, period_start date, period_end date, detail jsonb)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with bounds as (
    select
      case kind
        when 'weekly'  then (current_date - interval '7 days')::date
        when 'monthly' then (date_trunc('month', current_date) - interval '1 month')::date
      end as starts,
      case kind
        when 'weekly'  then (current_date - interval '1 day')::date
        when 'monthly' then (date_trunc('month', current_date) - interval '1 day')::date
      end as ends
  ),
  pref_key as (
    select case kind
      when 'weekly'  then 'weeklySummary'
      when 'monthly' then 'monthlyReport'
    end as key
  ),
  wanted as (
    select s.user_id, p.email, p.name
    from public.settings s
    join public.profiles p on p.id = s.user_id
    cross join pref_key
    where coalesce(s.notifications -> pref_key.key ->> 'email', 'false') = 'true'
      and p.email <> ''
  ),
  rate as (select rates from public.fx_rates order by as_of desc limit 1),
  per as (
    select w.user_id, w.email, w.name, b.starts, b.ends, e.type, e.amount,
           e.category, e.p2p_direction
    from wanted w
    cross join bounds b
    join public.entries e
      on e.user_id = w.user_id
     and e.occurred_at >= b.starts
     and e.occurred_at < (b.ends + 1)
  ),
  totals as (
    select user_id, email, name, starts, ends,
      count(*) as entry_count,
      coalesce(sum(amount) filter (where type = 'profit'), 0) as income,
      coalesce(sum(amount) filter (where type in ('loss','fee','tax')), 0) as outgoings,
      count(*) filter (where type = 'profit')   as n_profit,
      count(*) filter (where type = 'loss')     as n_loss,
      count(*) filter (where type = 'fee')      as n_fee,
      count(*) filter (where type = 'tax')      as n_tax,
      count(*) filter (where type = 'transfer') as n_transfer,
      count(*) filter (where type = 'p2p')      as n_p2p,
      count(*) filter (where type = 'p2p' and p2p_direction = 'usd-to-cash') as n_cashout,
      coalesce(sum(amount) filter (where type = 'p2p' and p2p_direction = 'usd-to-cash'), 0) as cashed_out
    from per
    group by user_id, email, name, starts, ends
  ),
  top_income as (
    select distinct on (user_id) user_id, category, sum(amount) as amount
    from per where type = 'profit' and category is not null
    group by user_id, category
    order by user_id, sum(amount) desc
  ),
  top_loss as (
    select distinct on (user_id) user_id, category, sum(amount) as amount
    from per where type in ('loss','fee','tax') and category is not null
    group by user_id, category
    order by user_id, sum(amount) desc
  ),
  -- Progress read the way the app reads it: a goal naming a category counts
  -- that category's amounts, anything else counts net result. Twice over —
  -- once across the whole goal, once across the reported period alone.
  goal_pct as (
    select
      g.user_id, g.title,
      coalesce(g.end_date - g.start_date, 365) as span_days,
      g.target_amount / nullif(coalesce((select (rates ->> g.currency)::numeric from rate), 1), 0) as target_usd,
      greatest(coalesce((
        select sum(case
                 when g.track_category is not null then e.amount
                 when e.type = 'profit' then e.amount
                 when e.type in ('loss','fee','tax') then -e.amount
                 else 0 end)
        from public.entries e
        where e.user_id = g.user_id
          and (g.start_date is null or e.occurred_at >= g.start_date)
          and (g.end_date is null or e.occurred_at < (g.end_date + 1))
          and (g.track_category is null or e.category = g.track_category)
      ), 0), 0) as achieved_usd,
      -- The same sum, narrowed to the reported period and clipped to the
      -- goal's own dates so a goal starting mid-month is not over-credited.
      greatest(coalesce((
        select sum(case
                 when g.track_category is not null then e.amount
                 when e.type = 'profit' then e.amount
                 when e.type in ('loss','fee','tax') then -e.amount
                 else 0 end)
        from public.entries e
        where e.user_id = g.user_id
          and e.occurred_at >= greatest(b.starts, coalesce(g.start_date, b.starts))
          and e.occurred_at < (least(b.ends, coalesce(g.end_date, b.ends)) + 1)
          and (g.track_category is null or e.category = g.track_category)
      ), 0), 0) as month_usd
    from public.goals g
    cross join bounds b
    where g.start_date <= b.ends and coalesce(g.end_date, b.ends) >= b.starts
  ),
  monthly_goal as (
    select distinct on (user_id) * from goal_pct
    where span_days <= 45 order by user_id, target_usd desc
  ),
  yearly_goal as (
    select distinct on (user_id) * from goal_pct
    where span_days > 45 order by user_id, target_usd desc
  )
  select
    t.user_id, t.email, t.name,
    t.entry_count,
    t.income - t.outgoings as net,
    t.income, t.outgoings,
    t.starts, t.ends,
    jsonb_strip_nulls(jsonb_build_object(
      'counts', jsonb_build_object(
        'profit', t.n_profit, 'loss', t.n_loss, 'fee', t.n_fee,
        'tax', t.n_tax, 'transfer', t.n_transfer, 'p2p', t.n_p2p,
        'cashout', t.n_cashout
      ),
      'cashedOut', t.cashed_out,
      'topIncome', case when ti.category is not null then jsonb_build_object(
        'category', ti.category,
        'amount', round(ti.amount, 2),
        'shareOfIncome', case when t.income > 0
          then round(100 * ti.amount / t.income, 1) else 0 end
      ) end,
      'topLoss', case when tl.category is not null then jsonb_build_object(
        'category', tl.category,
        'amount', round(tl.amount, 2),
        'shareOfOutgoings', case when t.outgoings > 0
          then round(100 * tl.amount / t.outgoings, 1) else 0 end
      ) end,
      'monthlyGoal', case when mg.title is not null and mg.target_usd > 0 then jsonb_build_object(
        'title', mg.title,
        'targetUsd', round(mg.target_usd, 2),
        'achievedUsd', round(mg.achieved_usd, 2),
        'monthUsd', round(mg.month_usd, 2),
        'percent', round(100 * mg.achieved_usd / mg.target_usd, 1),
        'monthPercent', round(100 * mg.month_usd / mg.target_usd, 1)
      ) end,
      'yearlyGoal', case when yg.title is not null and yg.target_usd > 0 then jsonb_build_object(
        'title', yg.title,
        'targetUsd', round(yg.target_usd, 2),
        'achievedUsd', round(yg.achieved_usd, 2),
        'monthUsd', round(yg.month_usd, 2),
        'percent', round(100 * yg.achieved_usd / yg.target_usd, 1),
        'monthPercent', round(100 * yg.month_usd / yg.target_usd, 1)
      ) end
    )) as detail
  from totals t
  left join top_income ti on ti.user_id = t.user_id
  left join top_loss tl on tl.user_id = t.user_id
  left join monthly_goal mg on mg.user_id = t.user_id
  left join yearly_goal yg on yg.user_id = t.user_id;
$function$;
