create extension if not exists "pgcrypto";

alter table public.reseller_profiles
  add column if not exists account_manager_user_id uuid references auth.users(id) on delete set null,
  add column if not exists account_manager_email text;

alter table public.profiles
  add column if not exists account_manager_user_id uuid references auth.users(id) on delete set null,
  add column if not exists account_manager_name text,
  add column if not exists account_manager_email text,
  add column if not exists account_manager_whatsapp text,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_reseller_profiles_account_manager_user_id on public.reseller_profiles(account_manager_user_id);
create index if not exists idx_reseller_profiles_account_manager_email on public.reseller_profiles(lower(account_manager_email));
create index if not exists idx_orders_cliente_id on public.orders(cliente_id);
create index if not exists idx_orders_customer_email on public.orders(lower(customer_email));
create index if not exists idx_orders_seller_id on public.orders(seller_id);

update public.profiles
set role = 'seller'
where user_type = 'gerente'
  and role = 'admin';

update public.reseller_profiles rp
set account_manager_user_id = p.auth_user_id,
    account_manager_name = coalesce(rp.account_manager_name, p.full_name, p.company_name),
    account_manager_email = coalesce(rp.account_manager_email, p.email),
    account_manager_whatsapp = coalesce(rp.account_manager_whatsapp, p.telefone),
    updated_at = now()
from public.profiles p
where rp.account_manager_user_id is null
  and rp.account_manager_email is not null
  and lower(coalesce(p.email, '')) = lower(rp.account_manager_email)
  and p.user_type = 'gerente';

update public.profiles p
set account_manager_user_id = coalesce(p.account_manager_user_id, rp.account_manager_user_id),
    account_manager_name = coalesce(rp.account_manager_name, p.account_manager_name),
    account_manager_email = coalesce(rp.account_manager_email, p.account_manager_email),
    account_manager_whatsapp = coalesce(rp.account_manager_whatsapp, p.account_manager_whatsapp),
    updated_at = now()
from public.reseller_profiles rp
where (p.role = 'client' or p.user_type = 'cliente')
  and (
    (p.auth_user_id is not null and p.auth_user_id = rp.user_id)
    or lower(coalesce(p.email, '')) = lower(coalesce(rp.email, ''))
  );

create or replace function public.current_auth_email()
returns text
language sql
stable
as $$
  select lower(nullif(coalesce(auth.jwt() ->> 'email', ''), ''));
$$;

create or replace function public.is_manager_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where (p.auth_user_id = auth.uid() or lower(coalesce(p.email, '')) = public.current_auth_email())
      and p.role = 'seller'
      and p.user_type = 'gerente'
      and p.deleted_at is null
  );
$$;

create or replace function public.is_non_manager_seller()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where (p.auth_user_id = auth.uid() or lower(coalesce(p.email, '')) = public.current_auth_email())
      and p.role = 'seller'
      and coalesce(p.user_type, '') <> 'gerente'
      and p.deleted_at is null
  );
$$;

create or replace function public.manager_matches_assignment(p_manager_user_id uuid, p_manager_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_manager_user()
    and (
      (p_manager_user_id is not null and p_manager_user_id = auth.uid())
      or (p_manager_email is not null and lower(p_manager_email) = public.current_auth_email())
    );
$$;

create or replace function public.can_access_reseller_profile(
  p_reseller_id uuid default null,
  p_user_id uuid default null,
  p_email text default null
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.reseller_profiles rp
    where (
      (p_reseller_id is not null and rp.id = p_reseller_id)
      or (p_user_id is not null and rp.user_id = p_user_id)
      or (p_email is not null and lower(coalesce(rp.email, '')) = lower(p_email))
    )
    and (
      public.is_admin_user()
      or auth.uid() = rp.user_id
      or lower(coalesce(rp.email, '')) = public.current_auth_email()
      or public.manager_matches_assignment(rp.account_manager_user_id, rp.account_manager_email)
    )
  );
$$;

create or replace function public.can_access_order_by_identity(
  p_cliente_id uuid,
  p_customer_email text,
  p_seller_id uuid default null
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (
    public.is_admin_user()
    or (
      public.is_manager_user()
      and exists (
        select 1
        from public.reseller_profiles rp
        where (
          (p_cliente_id is not null and (rp.id = p_cliente_id or rp.user_id = p_cliente_id))
          or (p_customer_email is not null and lower(coalesce(rp.email, '')) = lower(p_customer_email))
        )
        and public.manager_matches_assignment(rp.account_manager_user_id, rp.account_manager_email)
      )
    )
    or (
      public.is_non_manager_seller()
      and (p_seller_id is null or p_seller_id = auth.uid())
    )
    or (
      auth.uid() is not null
      and (
        (p_cliente_id is not null and p_cliente_id = auth.uid())
        or (p_customer_email is not null and lower(p_customer_email) = public.current_auth_email())
        or exists (
          select 1
          from public.reseller_profiles rp
          where p_cliente_id is not null
            and rp.id = p_cliente_id
            and rp.user_id = auth.uid()
        )
      )
    )
  );
$$;

create or replace function public.can_update_order_directly(
  p_cliente_id uuid,
  p_customer_email text,
  p_seller_id uuid default null
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (
    public.is_admin_user()
    or (
      public.is_non_manager_seller()
      and (p_seller_id is null or p_seller_id = auth.uid())
    )
    or (
      auth.uid() is not null
      and (
        (p_cliente_id is not null and p_cliente_id = auth.uid())
        or (p_customer_email is not null and lower(p_customer_email) = public.current_auth_email())
        or exists (
          select 1
          from public.reseller_profiles rp
          where p_cliente_id is not null
            and rp.id = p_cliente_id
            and rp.user_id = auth.uid()
        )
      )
    )
  );
$$;

create or replace function public.can_access_order(p_order_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and public.can_access_order_by_identity(o.cliente_id, o.customer_email, o.seller_id)
  );
$$;

create or replace function public.order_extract_id(p_object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  raw_id text;
begin
  raw_id := split_part(coalesce(p_object_name, ''), '/', 1);
  begin
    return raw_id::uuid;
  exception
    when others then
      return null;
  end;
end;
$$;

create or replace function public.can_access_order_storage_object(p_object_name text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.can_access_order(public.order_extract_id(p_object_name));
$$;

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- profiles
 drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or lower(coalesce(email, '')) = public.current_auth_email()
);

 drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles
for select
to authenticated
using (public.is_admin_user());

 drop policy if exists "profiles_select_manager_clients" on public.profiles;
create policy "profiles_select_manager_clients"
on public.profiles
for select
to authenticated
using (
  (role = 'client' or user_type = 'cliente')
  and public.can_access_reseller_profile(null, auth_user_id, email)
);

 drop policy if exists "profiles_select_non_manager_seller_clients" on public.profiles;
create policy "profiles_select_non_manager_seller_clients"
on public.profiles
for select
to authenticated
using (
  public.is_non_manager_seller()
  and (role = 'client' or user_type = 'cliente')
  and coalesce(status_cadastro, 'pending') = 'approved'
  and deleted_at is null
);

 drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (
  auth.uid() = auth_user_id
  or lower(coalesce(email, '')) = public.current_auth_email()
)
with check (
  auth.uid() = auth_user_id
  or lower(coalesce(email, '')) = public.current_auth_email()
);

 drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- reseller_profiles
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

 drop policy if exists "manager_select_reseller_profiles" on public.reseller_profiles;
create policy "manager_select_reseller_profiles"
on public.reseller_profiles
for select
to authenticated
using (
  public.is_manager_user()
  and public.manager_matches_assignment(account_manager_user_id, account_manager_email)
);

 drop policy if exists "non_manager_seller_select_approved_reseller_profiles" on public.reseller_profiles;
create policy "non_manager_seller_select_approved_reseller_profiles"
on public.reseller_profiles
for select
to authenticated
using (
  public.is_non_manager_seller()
  and status_cadastro = 'approved'
);

-- orders
 drop policy if exists "orders_select_scoped" on public.orders;
create policy "orders_select_scoped"
on public.orders
for select
to authenticated
using (
  deleted_at is null
  and public.can_access_order_by_identity(cliente_id, customer_email, seller_id)
);

 drop policy if exists "orders_insert_scoped" on public.orders;
create policy "orders_insert_scoped"
on public.orders
for insert
to authenticated
with check (
  deleted_at is null
  and (
    public.is_admin_user()
    or public.is_non_manager_seller()
    or (
      auth.uid() is not null
      and (
        (cliente_id is not null and cliente_id = auth.uid())
        or (customer_email is not null and lower(customer_email) = public.current_auth_email())
        or exists (
          select 1
          from public.reseller_profiles rp
          where cliente_id is not null
            and rp.id = cliente_id
            and rp.user_id = auth.uid()
        )
      )
    )
  )
);

 drop policy if exists "orders_update_direct_scoped" on public.orders;
create policy "orders_update_direct_scoped"
on public.orders
for update
to authenticated
using (
  deleted_at is null
  and public.can_update_order_directly(cliente_id, customer_email, seller_id)
)
with check (
  public.can_update_order_directly(cliente_id, customer_email, seller_id)
);

 drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin"
on public.orders
for delete
to authenticated
using (public.is_admin_user());

-- chat
create or replace function public.chat_can_access_conversation(p_conversation_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_conversations c
    where c.id = p_conversation_id
      and (
        c.customer_user_id = auth.uid()
        or public.is_admin_user()
        or (
          public.is_manager_user()
          and exists (
            select 1
            from public.reseller_profiles rp
            where (
              (c.reseller_profile_id is not null and rp.id = c.reseller_profile_id)
              or rp.user_id = c.customer_user_id
              or lower(coalesce(rp.email, '')) = lower(coalesce(c.customer_email, ''))
            )
            and public.manager_matches_assignment(rp.account_manager_user_id, rp.account_manager_email)
          )
        )
        or (public.is_non_manager_seller() and c.assigned_admin_id = auth.uid())
      )
  );
$$;

create or replace function public.chat_can_access_presence_user(p_presence_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (
    p_presence_user_id = auth.uid()
    or public.is_admin_user()
    or exists (
      select 1
      from public.profiles p
      where p.auth_user_id = p_presence_user_id
        and p.role in ('admin', 'seller')
        and p.deleted_at is null
    )
    or exists (
      select 1
      from public.chat_conversations c
      where c.customer_user_id = p_presence_user_id
        and public.chat_can_access_conversation(c.id)
    )
  );
$$;

create or replace function public.chat_start_or_reuse_conversation(
  p_customer_name text,
  p_customer_email text default null,
  p_customer_phone text default null,
  p_subject text default null,
  p_order_reference text default null,
  p_initial_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_reseller_profile_id uuid;
  v_assigned_admin_id uuid;
  v_assigned_admin_name text;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  select rp.id, rp.account_manager_user_id, rp.account_manager_name
    into v_reseller_profile_id, v_assigned_admin_id, v_assigned_admin_name
  from public.reseller_profiles rp
  where rp.user_id = v_user_id
     or lower(coalesce(rp.email, '')) = lower(coalesce(p_customer_email, ''))
  order by case when rp.user_id = v_user_id then 0 else 1 end
  limit 1;

  select c.id
    into v_conversation_id
  from public.chat_conversations c
  where c.customer_user_id = v_user_id
    and c.status in ('pending', 'active')
  order by c.last_message_at desc nulls last, c.created_at desc
  limit 1;

  if v_conversation_id is null then
    begin
      insert into public.chat_conversations (
        customer_user_id,
        reseller_profile_id,
        customer_name,
        customer_email,
        customer_phone,
        subject,
        order_reference,
        status,
        assigned_admin_id,
        assigned_admin_name,
        last_message_at
      )
      values (
        v_user_id,
        v_reseller_profile_id,
        coalesce(nullif(trim(p_customer_name), ''), 'Cliente'),
        nullif(trim(coalesce(p_customer_email, '')), ''),
        nullif(trim(coalesce(p_customer_phone, '')), ''),
        coalesce(nullif(trim(p_subject), ''), 'Atendimento comercial'),
        nullif(trim(coalesce(p_order_reference, '')), ''),
        'pending',
        v_assigned_admin_id,
        nullif(trim(coalesce(v_assigned_admin_name, '')), ''),
        now()
      )
      returning id into v_conversation_id;
    exception
      when unique_violation then
        select c.id
          into v_conversation_id
        from public.chat_conversations c
        where c.customer_user_id = v_user_id
          and c.status in ('pending', 'active')
        order by c.last_message_at desc nulls last, c.created_at desc
        limit 1;
    end;
  else
    update public.chat_conversations
       set reseller_profile_id = coalesce(reseller_profile_id, v_reseller_profile_id),
           customer_name = coalesce(nullif(trim(p_customer_name), ''), customer_name),
           customer_email = coalesce(nullif(trim(coalesce(p_customer_email, '')), ''), customer_email),
           customer_phone = coalesce(nullif(trim(coalesce(p_customer_phone, '')), ''), customer_phone),
           order_reference = coalesce(nullif(trim(coalesce(p_order_reference, '')), ''), order_reference),
           assigned_admin_id = coalesce(assigned_admin_id, v_assigned_admin_id),
           assigned_admin_name = coalesce(assigned_admin_name, nullif(trim(coalesce(v_assigned_admin_name, '')), '')),
           updated_at = now()
     where id = v_conversation_id;
  end if;

  insert into public.chat_participants (
    conversation_id,
    user_id,
    participant_type,
    display_name,
    email,
    phone,
    last_read_at
  )
  values (
    v_conversation_id,
    v_user_id,
    'customer',
    coalesce(nullif(trim(p_customer_name), ''), 'Cliente'),
    nullif(trim(coalesce(p_customer_email, '')), ''),
    nullif(trim(coalesce(p_customer_phone, '')), ''),
    now()
  )
  on conflict (conversation_id, user_id)
  do update
     set display_name = excluded.display_name,
         email = excluded.email,
         phone = excluded.phone,
         last_read_at = now();

  if nullif(trim(coalesce(p_initial_message, '')), '') is not null then
    insert into public.chat_messages (
      conversation_id,
      sender_user_id,
      sender_type,
      sender_name,
      message_type,
      content
    )
    values (
      v_conversation_id,
      v_user_id,
      'customer',
      coalesce(nullif(trim(p_customer_name), ''), 'Cliente'),
      'text',
      trim(p_initial_message)
    );
  end if;

  return v_conversation_id;
end;
$$;

create or replace function public.chat_update_conversation_status(
  p_conversation_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_staff boolean := public.chat_is_staff();
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  if p_status not in ('pending', 'active', 'closed') then
    raise exception 'invalid_status';
  end if;

  if not public.chat_can_access_conversation(p_conversation_id) then
    raise exception 'forbidden';
  end if;

  if not v_is_staff and p_status not in ('pending', 'closed') then
    raise exception 'forbidden';
  end if;

  update public.chat_conversations
     set status = p_status,
         closed_at = case when p_status = 'closed' then now() else null end,
         updated_at = now()
   where id = p_conversation_id;
end;
$$;

create or replace function public.chat_assign_conversation(
  p_conversation_id uuid,
  p_assigned_admin_id uuid,
  p_assigned_admin_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if not public.is_admin_user() then
    raise exception 'forbidden';
  end if;

  if not public.chat_can_access_conversation(p_conversation_id) then
    raise exception 'forbidden';
  end if;

  update public.chat_conversations
     set assigned_admin_id = p_assigned_admin_id,
         assigned_admin_name = p_assigned_admin_name,
         updated_at = now()
   where id = p_conversation_id;
end;
$$;

drop policy if exists "chat_conversations_update_staff" on public.chat_conversations;
create policy "chat_conversations_update_staff"
on public.chat_conversations
for update
to authenticated
using (public.chat_is_staff() and public.chat_can_access_conversation(id))
with check (public.chat_is_staff() and public.chat_can_access_conversation(id));

drop policy if exists "chat_presence_select" on public.chat_presence;
create policy "chat_presence_select"
on public.chat_presence
for select
to authenticated
using (public.chat_can_access_presence_user(user_id));

-- storage: pedidos
create or replace function public.order_can_backoffice_upload(p_object_name text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.can_access_order_storage_object(p_object_name)
    and (public.is_admin_user() or public.is_manager_user() or public.is_non_manager_seller());
$$;

drop policy if exists "Admin e seller upload payment pdf" on storage.objects;
create policy "Admin e seller upload payment pdf"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'order-payment-files'
  and public.order_can_backoffice_upload(name)
);

drop policy if exists "Admin e seller update payment pdf" on storage.objects;
create policy "Admin e seller update payment pdf"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'order-payment-files'
  and public.order_can_backoffice_upload(name)
)
with check (
  bucket_id = 'order-payment-files'
  and public.order_can_backoffice_upload(name)
);

drop policy if exists "Admin e seller delete payment pdf" on storage.objects;
create policy "Admin e seller delete payment pdf"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'order-payment-files'
  and public.order_can_backoffice_upload(name)
);

drop policy if exists "Client upload payment proof" on storage.objects;
create policy "Client upload payment proof"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'order-payment-proofs'
  and public.can_access_order_storage_object(name)
);

drop policy if exists "Client update payment proof" on storage.objects;
create policy "Client update payment proof"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'order-payment-proofs'
  and public.can_access_order_storage_object(name)
)
with check (
  bucket_id = 'order-payment-proofs'
  and public.can_access_order_storage_object(name)
);

drop policy if exists "Admin e seller read payment proof" on storage.objects;
create policy "Admin e seller read payment proof"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'order-payment-proofs'
  and public.can_access_order_storage_object(name)
);

notify pgrst, 'reload schema';
