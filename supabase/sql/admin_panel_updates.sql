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
  add column if not exists updated_by_admin_id uuid references auth.users(id) on delete set null;

alter table public.profiles
  add column if not exists user_type text,
  add column if not exists notes text;

create index if not exists idx_orders_deleted_at on public.orders(deleted_at);
create index if not exists idx_orders_status_deleted_at on public.orders(status, deleted_at);
create index if not exists idx_reseller_profiles_status_cadastro on public.reseller_profiles(status_cadastro);

notify pgrst, 'reload schema';
