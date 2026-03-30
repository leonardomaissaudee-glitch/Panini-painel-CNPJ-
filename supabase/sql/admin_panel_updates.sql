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

do $$
declare
  status_udt text;
begin
  select udt_name
  into status_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'orders'
    and column_name = 'status';

  if status_udt is not null and status_udt not in ('text', 'varchar', 'bpchar') then
    execute 'alter table public.orders alter column status drop default';
    execute 'alter table public.orders alter column status type text using status::text';
  end if;
end $$;

alter table public.orders
  add column if not exists deleted_at timestamptz,
  add column if not exists original_total numeric(10,2),
  add column if not exists admin_discount_type text,
  add column if not exists admin_discount_value numeric(10,2),
  add column if not exists admin_discount_amount numeric(10,2),
  add column if not exists admin_bonus_type text,
  add column if not exists admin_bonus_value numeric(10,2),
  add column if not exists admin_bonus_amount numeric(10,2),
  add column if not exists admin_bonus_product_id text,
  add column if not exists admin_bonus_product_name text,
  add column if not exists admin_bonus_quantity integer,
  add column if not exists gift_items jsonb not null default '[]'::jsonb,
  add column if not exists updated_by_admin_id uuid references auth.users(id) on delete set null;

alter table public.profiles
  add column if not exists user_type text,
  add column if not exists company_name text,
  add column if not exists notes text;

create table if not exists public.gift_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  reference text,
  quantity_available integer not null default 0,
  is_active boolean not null default true,
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.gift_catalog_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_gift_catalog_updated_at on public.gift_catalog;
create trigger trg_gift_catalog_updated_at
before update on public.gift_catalog
for each row
execute function public.gift_catalog_set_updated_at();

alter table public.gift_catalog enable row level security;

drop policy if exists "admin_select_gift_catalog" on public.gift_catalog;
create policy "admin_select_gift_catalog"
on public.gift_catalog
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admin_insert_gift_catalog" on public.gift_catalog;
create policy "admin_insert_gift_catalog"
on public.gift_catalog
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "admin_update_gift_catalog" on public.gift_catalog;
create policy "admin_update_gift_catalog"
on public.gift_catalog
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "admin_delete_gift_catalog" on public.gift_catalog;
create policy "admin_delete_gift_catalog"
on public.gift_catalog
for delete
to authenticated
using (public.is_admin_user());


drop policy if exists "admin_select_reseller_profiles" on public.reseller_profiles;
create policy "admin_select_reseller_profiles"
on public.reseller_profiles
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admin_update_reseller_profiles" on public.reseller_profiles;
create policy "admin_update_reseller_profiles"
on public.reseller_profiles
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
create index if not exists idx_orders_deleted_at on public.orders(deleted_at);
create index if not exists idx_orders_status_deleted_at on public.orders(status, deleted_at);
create index if not exists idx_reseller_profiles_status_cadastro on public.reseller_profiles(status_cadastro);
create index if not exists idx_gift_catalog_is_active on public.gift_catalog(is_active);
create index if not exists idx_gift_catalog_created_at on public.gift_catalog(created_at desc);

update public.orders
set gift_items = '[]'::jsonb
where gift_items is null;

notify pgrst, 'reload schema';

