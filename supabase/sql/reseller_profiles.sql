-- Enable required extension
create extension if not exists "pgcrypto";

-- Main table
create table if not exists public.reseller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  cnpj text not null unique,
  razao_social text not null,
  nome_fantasia text,
  inscricao_estadual text,
  segmento text not null,
  data_abertura date,
  porte_empresa text,
  nome_responsavel text not null,
  cpf_responsavel text,
  cargo_responsavel text,
  telefone text not null,
  whatsapp text,
  email text not null,
  cep text not null,
  endereco text not null,
  numero text not null,
  complemento text,
  bairro text not null,
  cidade text not null,
  estado text not null,
  canal_revenda text not null,
  trabalha_com_colecionaveis boolean not null default false,
  faixa_investimento text not null,
  observacoes text,
  aceitou_veracidade boolean not null default false,
  aceitou_termos boolean not null default false,
  aceitou_contato boolean not null default false,
  motivo_reprovacao text,
  account_manager_name text,
  account_manager_whatsapp text,
  status_cadastro text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reseller_profiles_cnpj on public.reseller_profiles (cnpj);
create index if not exists idx_reseller_profiles_user_id on public.reseller_profiles (user_id);

-- trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_reseller_profiles on public.reseller_profiles;
create trigger trg_set_updated_at_reseller_profiles
before update on public.reseller_profiles
for each row
execute function public.set_updated_at();

-- RLS
alter table public.reseller_profiles enable row level security;

alter table public.reseller_profiles
alter column status_cadastro set default 'pending';

update public.reseller_profiles
set status_cadastro = 'pending'
where status_cadastro = 'pendente';

drop policy if exists "reseller_insert_own" on public.reseller_profiles;
create policy "reseller_insert_own"
on public.reseller_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reseller_select_own" on public.reseller_profiles;
create policy "reseller_select_own"
on public.reseller_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reseller_update_own" on public.reseller_profiles;
create policy "reseller_update_own"
on public.reseller_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Function to map CNPJ -> auth email (minimal return for custom login)
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

notify pgrst, 'reload schema';
