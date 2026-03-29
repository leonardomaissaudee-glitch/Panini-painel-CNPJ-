alter table public.reseller_profiles
  add column if not exists motivo_reprovacao text,
  add column if not exists account_manager_name text,
  add column if not exists account_manager_whatsapp text;

create or replace function public.get_auth_email_by_cnpj(cnpj_input text)
returns text
language sql
security definer
set search_path = public
as $$
  select rp.email
  from public.reseller_profiles rp
  where regexp_replace(rp.cnpj, '\D', '', 'g') = regexp_replace(cnpj_input, '\D', '', 'g')
  limit 1;
$$;

revoke all on function public.get_auth_email_by_cnpj(text) from public;
grant execute on function public.get_auth_email_by_cnpj(text) to anon, authenticated;

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
  add column if not exists cliente_id uuid,
  add column if not exists status text,
  add column if not exists invoice_number text,
  add column if not exists tracking_code text,
  add column if not exists seller_id uuid,
  add column if not exists account_manager_name text,
  add column if not exists account_manager_whatsapp text;

update public.orders
set status = 'novo_pedido'
where status is null;

alter table public.orders
  alter column status set default 'novo_pedido';

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('pix', 'credit_card', 'boleto'));

create index if not exists idx_orders_status on public.orders(status);

notify pgrst, 'reload schema';
