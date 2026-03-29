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
  add column if not exists account_manager_whatsapp text,
  add column if not exists payment_instructions text,
  add column if not exists payment_copy_paste text,
  add column if not exists payment_link_url text,
  add column if not exists payment_boleto_line text,
  add column if not exists payment_boleto_pdf_url text,
  add column if not exists payment_pix_bank_name text,
  add column if not exists payment_pix_key text,
  add column if not exists payment_pix_beneficiary text,
  add column if not exists payment_pix_agency text,
  add column if not exists payment_pix_account text,
  add column if not exists payment_pix_amount text,
  add column if not exists payment_pix_qr_code text,
  add column if not exists payment_receipt_url text,
  add column if not exists payment_receipt_name text,
  add column if not exists payment_receipt_uploaded_at timestamptz;

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-payment-proofs',
  'order-payment-proofs',
  true,
  5242880,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-payment-files',
  'order-payment-files',
  true,
  5242880,
  array['application/pdf']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf'];

drop policy if exists "Admin e seller upload payment pdf" on storage.objects;
create policy "Admin e seller upload payment pdf"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'order-payment-files'
  and exists (
    select 1
    from public.profiles p
    where (p.auth_user_id = auth.uid() or lower(p.email) = lower(auth.jwt() ->> 'email'))
      and p.role in ('admin', 'seller')
  )
);

drop policy if exists "Admin e seller update payment pdf" on storage.objects;
create policy "Admin e seller update payment pdf"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'order-payment-files'
  and exists (
    select 1
    from public.profiles p
    where (p.auth_user_id = auth.uid() or lower(p.email) = lower(auth.jwt() ->> 'email'))
      and p.role in ('admin', 'seller')
  )
)
with check (
  bucket_id = 'order-payment-files'
  and exists (
    select 1
    from public.profiles p
    where (p.auth_user_id = auth.uid() or lower(p.email) = lower(auth.jwt() ->> 'email'))
      and p.role in ('admin', 'seller')
  )
);

drop policy if exists "Admin e seller delete payment pdf" on storage.objects;
create policy "Admin e seller delete payment pdf"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'order-payment-files'
  and exists (
    select 1
    from public.profiles p
    where (p.auth_user_id = auth.uid() or lower(p.email) = lower(auth.jwt() ->> 'email'))
      and p.role in ('admin', 'seller')
  )
);

drop policy if exists "Client upload payment proof" on storage.objects;
create policy "Client upload payment proof"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'order-payment-proofs'
  and exists (
    select 1
    from public.reseller_profiles rp
    where rp.user_id = auth.uid()
  )
);

drop policy if exists "Client update payment proof" on storage.objects;
create policy "Client update payment proof"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'order-payment-proofs'
  and exists (
    select 1
    from public.reseller_profiles rp
    where rp.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'order-payment-proofs'
  and exists (
    select 1
    from public.reseller_profiles rp
    where rp.user_id = auth.uid()
  )
);

drop policy if exists "Client read payment proof" on storage.objects;
create policy "Client read payment proof"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'order-payment-proofs'
);

drop policy if exists "Admin e seller read payment proof" on storage.objects;
create policy "Admin e seller read payment proof"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'order-payment-proofs'
  and exists (
    select 1
    from public.profiles p
    where (p.auth_user_id = auth.uid() or lower(p.email) = lower(auth.jwt() ->> 'email'))
      and p.role in ('admin', 'seller')
  )
);

notify pgrst, 'reload schema';
