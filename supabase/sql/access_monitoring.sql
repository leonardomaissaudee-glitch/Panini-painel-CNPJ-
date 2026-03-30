create extension if not exists "pgcrypto";

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where (p.auth_user_id = auth.uid() or lower(coalesce(p.email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')))
      and p.role = 'admin'
  );
$$;

create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  ip text,
  country text,
  city text,
  region text,
  user_agent text,
  browser text,
  os text,
  device_type text,
  referer text,
  path text not null,
  method text not null default 'GET',
  host text,
  query_params jsonb not null default '{}'::jsonb,
  language text,
  screen_resolution text,
  page_title text,
  app_section text,
  extra jsonb not null default '{}'::jsonb
);

create table if not exists public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  ip text,
  country text,
  city text,
  region text,
  user_agent text,
  browser text,
  os text,
  device_type text,
  path text,
  host text,
  referer text,
  language text,
  screen_resolution text,
  page_title text,
  app_section text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create index if not exists idx_access_logs_created_at on public.access_logs (created_at desc);
create index if not exists idx_access_logs_session_id on public.access_logs (session_id);
create index if not exists idx_access_logs_ip on public.access_logs (ip);
create index if not exists idx_access_logs_path on public.access_logs (path);
create index if not exists idx_access_logs_app_section on public.access_logs (app_section);
create index if not exists idx_visitor_sessions_last_seen on public.visitor_sessions (last_seen desc);
create index if not exists idx_visitor_sessions_ip on public.visitor_sessions (ip);
create index if not exists idx_visitor_sessions_path on public.visitor_sessions (path);

create or replace function public.monitoring_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_visitor_sessions_updated_at on public.visitor_sessions;
create trigger trg_visitor_sessions_updated_at
before update on public.visitor_sessions
for each row
execute function public.monitoring_set_updated_at();

alter table public.access_logs enable row level security;
alter table public.visitor_sessions enable row level security;

drop policy if exists "admin_select_access_logs" on public.access_logs;
create policy "admin_select_access_logs"
on public.access_logs
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admin_select_visitor_sessions" on public.visitor_sessions;
create policy "admin_select_visitor_sessions"
on public.visitor_sessions
for select
to authenticated
using (public.is_admin_user());

create or replace function public.admin_get_access_dashboard(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_start timestamptz := coalesce(p_start, date_trunc('day', now()) - interval '29 days');
  v_end timestamptz := coalesce(p_end, now());
  v_payload jsonb;
begin
  if not public.is_admin_user() then
    raise exception 'forbidden';
  end if;

  with filtered as (
    select *
    from public.access_logs
    where created_at >= v_start
      and created_at <= v_end
  ),
  access_by_day as (
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*)::int as total
    from filtered
    group by 1
    order by 1
  ),
  top_pages as (
    select coalesce(nullif(path, ''), '/') as label, count(*)::int as total
    from filtered
    group by 1
    order by total desc, label asc
    limit 5
  ),
  top_countries as (
    select coalesce(nullif(country, ''), 'Desconhecido') as label, count(*)::int as total
    from filtered
    group by 1
    order by total desc, label asc
    limit 5
  ),
  top_devices as (
    select coalesce(nullif(device_type, ''), 'desktop') as label, count(*)::int as total
    from filtered
    group by 1
    order by total desc, label asc
    limit 5
  ),
  top_referrers as (
    select coalesce(nullif(regexp_replace(referer, '^https?://([^/]+).*$','\1'), ''), 'Direto') as label, count(*)::int as total
    from filtered
    group by 1
    order by total desc, label asc
    limit 5
  )
  select jsonb_build_object(
    'accesses_today', (
      select count(*)::int
      from public.access_logs
      where created_at >= date_trunc('day', now())
    ),
    'accesses_last_7_days', (
      select count(*)::int
      from public.access_logs
      where created_at >= now() - interval '7 days'
    ),
    'visitors_online_now', (
      select count(*)::int
      from public.visitor_sessions
      where last_seen >= now() - interval '2 minutes'
    ),
    'top_page', (
      select to_jsonb(tp)
      from (
        select label, total
        from top_pages
        limit 1
      ) tp
    ),
    'top_country', (
      select to_jsonb(tc)
      from (
        select label, total
        from top_countries
        limit 1
      ) tc
    ),
    'accesses_by_day', coalesce((select jsonb_agg(access_by_day order by day) from access_by_day), '[]'::jsonb),
    'top_pages', coalesce((select jsonb_agg(top_pages order by total desc, label asc) from top_pages), '[]'::jsonb),
    'top_countries', coalesce((select jsonb_agg(top_countries order by total desc, label asc) from top_countries), '[]'::jsonb),
    'top_devices', coalesce((select jsonb_agg(top_devices order by total desc, label asc) from top_devices), '[]'::jsonb),
    'top_referrers', coalesce((select jsonb_agg(top_referrers order by total desc, label asc) from top_referrers), '[]'::jsonb),
    'range_start', v_start,
    'range_end', v_end
  )
  into v_payload;

  return v_payload;
end;
$$;

create or replace function public.admin_get_access_logs(
  p_limit integer default 20,
  p_offset integer default 0,
  p_search text default null,
  p_path text default null,
  p_ip text default null,
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_start timestamptz := coalesce(p_start, now() - interval '30 days');
  v_end timestamptz := coalesce(p_end, now());
  v_payload jsonb;
begin
  if not public.is_admin_user() then
    raise exception 'forbidden';
  end if;

  with filtered as (
    select
      l.id,
      l.created_at,
      l.ip,
      l.country,
      l.city,
      l.region,
      l.path,
      l.browser,
      l.os,
      l.device_type,
      l.referer,
      l.host,
      l.session_id,
      l.app_section,
      l.language,
      l.screen_resolution,
      l.page_title,
      l.user_agent,
      s.last_seen,
      (s.last_seen >= now() - interval '2 minutes') as is_online
    from public.access_logs l
    left join public.visitor_sessions s
      on s.session_id = l.session_id
    where l.created_at >= v_start
      and l.created_at <= v_end
      and (p_path is null or p_path = '' or l.path ilike '%' || p_path || '%')
      and (p_ip is null or p_ip = '' or coalesce(l.ip, '') ilike '%' || p_ip || '%')
      and (
        p_search is null
        or p_search = ''
        or concat_ws(
          ' ',
          coalesce(l.path, ''),
          coalesce(l.ip, ''),
          coalesce(l.country, ''),
          coalesce(l.city, ''),
          coalesce(l.browser, ''),
          coalesce(l.os, ''),
          coalesce(l.device_type, ''),
          coalesce(l.referer, ''),
          coalesce(l.page_title, '')
        ) ilike '%' || p_search || '%'
      )
  ),
  paged as (
    select *
    from filtered
    order by created_at desc
    limit greatest(coalesce(p_limit, 20), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*)::int from filtered),
    'rows', coalesce((select jsonb_agg(paged order by created_at desc) from paged), '[]'::jsonb)
  )
  into v_payload;

  return v_payload;
end;
$$;

grant execute on function public.admin_get_access_dashboard(timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_get_access_logs(integer, integer, text, text, text, timestamptz, timestamptz) to authenticated;

notify pgrst, 'reload schema';
