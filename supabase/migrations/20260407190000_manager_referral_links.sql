create extension if not exists "pgcrypto";

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by_manager_user_id uuid references auth.users(id) on delete set null,
  add column if not exists referred_by_manager_name text,
  add column if not exists referred_by_manager_email text,
  add column if not exists referred_by_manager_whatsapp text,
  add column if not exists referral_code_used text,
  add column if not exists signup_origin text;

alter table public.reseller_profiles
  add column if not exists referred_by_manager_user_id uuid references auth.users(id) on delete set null,
  add column if not exists referred_by_manager_name text,
  add column if not exists referred_by_manager_email text,
  add column if not exists referred_by_manager_whatsapp text,
  add column if not exists referral_code_used text,
  add column if not exists signup_origin text not null default 'cadastro_direto';

create unique index if not exists idx_profiles_referral_code_unique
  on public.profiles (referral_code)
  where referral_code is not null;

create index if not exists idx_reseller_profiles_referred_by_manager_user_id
  on public.reseller_profiles (referred_by_manager_user_id);

create index if not exists idx_reseller_profiles_referral_code_used
  on public.reseller_profiles (referral_code_used);

create sequence if not exists public.manager_referral_code_seq;

create or replace function public.generate_manager_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  loop
    v_code := 'G' || nextval('public.manager_referral_code_seq')::text;
    exit when not exists (
      select 1
      from public.profiles p
      where p.referral_code = v_code
    );
  end loop;

  return v_code;
end;
$$;

create or replace function public.ensure_manager_referral_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.referral_code is not null then
    new.referral_code := upper(nullif(btrim(new.referral_code), ''));
  end if;

  if new.referral_code_used is not null then
    new.referral_code_used := upper(nullif(btrim(new.referral_code_used), ''));
  end if;

  if new.signup_origin is null or btrim(new.signup_origin) = '' then
    new.signup_origin := 'cadastro_direto';
  else
    new.signup_origin := lower(btrim(new.signup_origin));
  end if;

  if new.account_manager_email is not null then
    new.account_manager_email := lower(btrim(new.account_manager_email));
  end if;

  if new.referred_by_manager_email is not null then
    new.referred_by_manager_email := lower(btrim(new.referred_by_manager_email));
  end if;

  if coalesce(new.user_type, '') = 'gerente' and coalesce(new.deleted_at, null) is null then
    if new.referral_code is null or btrim(new.referral_code) = '' then
      new.referral_code := public.generate_manager_referral_code();
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.normalize_reseller_referral_tracking()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.referral_code_used is not null then
    new.referral_code_used := upper(nullif(btrim(new.referral_code_used), ''));
  end if;

  if new.signup_origin is null or btrim(new.signup_origin) = '' then
    new.signup_origin := 'cadastro_direto';
  else
    new.signup_origin := lower(btrim(new.signup_origin));
  end if;

  if new.account_manager_email is not null then
    new.account_manager_email := lower(btrim(new.account_manager_email));
  end if;

  if new.referred_by_manager_email is not null then
    new.referred_by_manager_email := lower(btrim(new.referred_by_manager_email));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_manager_referral_code on public.profiles;
create trigger trg_profiles_manager_referral_code
before insert or update on public.profiles
for each row
execute function public.ensure_manager_referral_code();

drop trigger if exists trg_reseller_profiles_referral_tracking on public.reseller_profiles;
create trigger trg_reseller_profiles_referral_tracking
before insert or update on public.reseller_profiles
for each row
execute function public.normalize_reseller_referral_tracking();

update public.profiles
set referral_code = public.generate_manager_referral_code()
where user_type = 'gerente'
  and deleted_at is null
  and (referral_code is null or btrim(referral_code) = '');

update public.profiles
set referral_code = upper(btrim(referral_code))
where referral_code is not null
  and referral_code <> upper(btrim(referral_code));

update public.profiles
set signup_origin = coalesce(lower(nullif(btrim(signup_origin), '')), 'cadastro_direto')
where signup_origin is distinct from coalesce(lower(nullif(btrim(signup_origin), '')), 'cadastro_direto');

update public.reseller_profiles
set signup_origin = coalesce(lower(nullif(btrim(signup_origin), '')), 'cadastro_direto')
where signup_origin is distinct from coalesce(lower(nullif(btrim(signup_origin), '')), 'cadastro_direto');

update public.reseller_profiles
set referral_code_used = upper(btrim(referral_code_used))
where referral_code_used is not null
  and referral_code_used <> upper(btrim(referral_code_used));

create or replace function public.resolve_manager_referral_code(p_referral_code text)
returns table (
  auth_user_id uuid,
  profile_id uuid,
  full_name text,
  email text,
  telefone text,
  referral_code text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.auth_user_id,
    p.id as profile_id,
    coalesce(p.company_name, 'Gerente comercial') as full_name,
    lower(coalesce(p.email, '')) as email,
    p.telefone,
    p.referral_code
  from public.profiles p
  where p.user_type = 'gerente'
    and p.deleted_at is null
    and coalesce(p.status_cadastro::text, '') in ('approved', 'aprovado')
    and p.referral_code = upper(trim(coalesce(p_referral_code, '')))
  limit 1;
$$;

revoke all on function public.resolve_manager_referral_code(text) from public;
grant execute on function public.resolve_manager_referral_code(text) to anon, authenticated;

notify pgrst, 'reload schema';
