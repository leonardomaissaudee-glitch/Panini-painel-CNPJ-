alter table public.orders
  add column if not exists estimated_delivery_date date;

update public.orders
set estimated_delivery_date = (timezone('America/Sao_Paulo', coalesce(created_at, now())))::date + 15
where estimated_delivery_date is null;

notify pgrst, 'reload schema';
