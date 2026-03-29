alter table public.reseller_profiles
  add column if not exists motivo_reprovacao text,
  add column if not exists account_manager_name text,
  add column if not exists account_manager_whatsapp text;

alter table public.reseller_profiles
  alter column status_cadastro set default 'pending';

update public.reseller_profiles
set status_cadastro = 'pending'
where status_cadastro = 'pendente';

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

alter table public.orders
  add column if not exists status text default 'aguardando_aprovacao',
  add column if not exists invoice_number text,
  add column if not exists tracking_code text,
  add column if not exists seller_id uuid,
  add column if not exists account_manager_name text,
  add column if not exists account_manager_whatsapp text;

create index if not exists idx_orders_status on public.orders(status);

notify pgrst, 'reload schema';
