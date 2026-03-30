create extension if not exists "pgcrypto";

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  reseller_profile_id uuid references public.reseller_profiles(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  subject text not null,
  order_reference text,
  status text not null default 'pending' check (status in ('pending', 'active', 'closed')),
  assigned_admin_id uuid references auth.users(id) on delete set null,
  assigned_admin_name text,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  unread_customer_count integer not null default 0,
  unread_admin_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.chat_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_type text not null check (participant_type in ('customer', 'admin', 'system')),
  display_name text,
  email text,
  phone text,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_type text not null check (sender_type in ('customer', 'admin', 'system')),
  sender_name text,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'pdf', 'file', 'audio')),
  content text,
  attachment_path text,
  attachment_name text,
  attachment_size bigint,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  delivered_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chat_messages_has_payload check (
    nullif(trim(coalesce(content, '')), '') is not null
    or attachment_path is not null
  )
);

create table if not exists public.chat_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'admin', 'seller', 'visitor')),
  display_name text,
  is_online boolean not null default false,
  current_conversation_id uuid references public.chat_conversations(id) on delete set null,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chat_conversations_customer_user on public.chat_conversations(customer_user_id);
create index if not exists idx_chat_conversations_status on public.chat_conversations(status);
create index if not exists idx_chat_conversations_last_message_at on public.chat_conversations(last_message_at desc);
create unique index if not exists idx_chat_conversations_single_open_per_customer
  on public.chat_conversations(customer_user_id)
  where status in ('pending', 'active');

create index if not exists idx_chat_messages_conversation on public.chat_messages(conversation_id, created_at);
create index if not exists idx_chat_messages_sender on public.chat_messages(sender_user_id);
create index if not exists idx_chat_participants_conversation on public.chat_participants(conversation_id);
create index if not exists idx_chat_participants_user on public.chat_participants(user_id);
create index if not exists idx_chat_presence_role on public.chat_presence(role, is_online);

create or replace function public.chat_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_chat_conversations_updated_at on public.chat_conversations;
create trigger trg_chat_conversations_updated_at
before update on public.chat_conversations
for each row
execute function public.chat_set_updated_at();

drop trigger if exists trg_chat_presence_updated_at on public.chat_presence;
create trigger trg_chat_presence_updated_at
before update on public.chat_presence
for each row
execute function public.chat_set_updated_at();

create or replace function public.chat_is_staff()
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
      and p.role in ('admin', 'seller')
  );
$$;

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
        or public.chat_is_staff()
      )
  );
$$;

create or replace function public.chat_extract_conversation_id(p_object_name text)
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

create or replace function public.chat_can_access_storage_object(p_object_name text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.chat_can_access_conversation(public.chat_extract_conversation_id(p_object_name));
$$;

create or replace function public.chat_sync_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preview_text text;
begin
  preview_text :=
    coalesce(
      nullif(left(trim(coalesce(new.content, '')), 180), ''),
      nullif(new.attachment_name, ''),
      case new.message_type
        when 'audio' then 'Áudio enviado'
        when 'image' then 'Imagem enviada'
        when 'pdf' then 'PDF enviado'
        else 'Arquivo enviado'
      end
    );

  update public.chat_conversations c
     set last_message_at = new.created_at,
         last_message_preview = preview_text,
         unread_admin_count = case
           when new.sender_type = 'customer' then coalesce(c.unread_admin_count, 0) + 1
           else c.unread_admin_count
         end,
         unread_customer_count = case
           when new.sender_type = 'admin' then coalesce(c.unread_customer_count, 0) + 1
           else c.unread_customer_count
         end,
         status = case
           when new.sender_type = 'admin' then 'active'
           when c.status = 'closed' then 'pending'
           else c.status
         end,
         closed_at = case
           when new.sender_type in ('customer', 'admin') then null
           else c.closed_at
         end,
         updated_at = now()
   where c.id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_chat_messages_sync_conversation on public.chat_messages;
create trigger trg_chat_messages_sync_conversation
after insert on public.chat_messages
for each row
execute function public.chat_sync_conversation_on_message();

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
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  select rp.id
    into v_reseller_profile_id
  from public.reseller_profiles rp
  where rp.user_id = v_user_id
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
       set customer_name = coalesce(nullif(trim(p_customer_name), ''), customer_name),
           customer_email = coalesce(nullif(trim(coalesce(p_customer_email, '')), ''), customer_email),
           customer_phone = coalesce(nullif(trim(coalesce(p_customer_phone, '')), ''), customer_phone),
           order_reference = coalesce(nullif(trim(coalesce(p_order_reference, '')), ''), order_reference),
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

create or replace function public.chat_mark_conversation_read(p_conversation_id uuid)
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

  if not public.chat_can_access_conversation(p_conversation_id) then
    raise exception 'forbidden';
  end if;

  if v_is_staff then
    update public.chat_conversations
       set unread_admin_count = 0,
           updated_at = now()
     where id = p_conversation_id;

    update public.chat_messages
       set read_at = now()
     where conversation_id = p_conversation_id
       and sender_type = 'customer'
       and read_at is null;
  else
    update public.chat_conversations
       set unread_customer_count = 0,
           updated_at = now()
     where id = p_conversation_id
       and customer_user_id = v_user_id;

    update public.chat_messages
       set read_at = now()
     where conversation_id = p_conversation_id
       and sender_type = 'admin'
       and read_at is null;
  end if;

  update public.chat_participants
     set last_read_at = now()
   where conversation_id = p_conversation_id
     and user_id = v_user_id;
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
  v_owner boolean;
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  if p_status not in ('pending', 'active', 'closed') then
    raise exception 'invalid_status';
  end if;

  select exists (
    select 1
    from public.chat_conversations c
    where c.id = p_conversation_id
      and c.customer_user_id = v_user_id
  )
  into v_owner;

  if not v_is_staff and not v_owner then
    raise exception 'forbidden';
  end if;

  if not v_is_staff and p_status <> 'pending' then
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

  if not public.chat_is_staff() then
    raise exception 'forbidden';
  end if;

  update public.chat_conversations
     set assigned_admin_id = p_assigned_admin_id,
         assigned_admin_name = p_assigned_admin_name,
         updated_at = now()
   where id = p_conversation_id;
end;
$$;

alter table public.chat_conversations enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_presence enable row level security;

drop policy if exists "chat_conversations_select" on public.chat_conversations;
create policy "chat_conversations_select"
on public.chat_conversations
for select
to authenticated
using (public.chat_can_access_conversation(id));

drop policy if exists "chat_conversations_insert" on public.chat_conversations;
create policy "chat_conversations_insert"
on public.chat_conversations
for insert
to authenticated
with check (customer_user_id = auth.uid() or public.chat_is_staff());

drop policy if exists "chat_conversations_update_staff" on public.chat_conversations;
create policy "chat_conversations_update_staff"
on public.chat_conversations
for update
to authenticated
using (public.chat_is_staff())
with check (public.chat_is_staff());

drop policy if exists "chat_participants_select" on public.chat_participants;
create policy "chat_participants_select"
on public.chat_participants
for select
to authenticated
using (public.chat_can_access_conversation(conversation_id));

drop policy if exists "chat_participants_insert" on public.chat_participants;
create policy "chat_participants_insert"
on public.chat_participants
for insert
to authenticated
with check (
  public.chat_can_access_conversation(conversation_id)
  and (user_id = auth.uid() or public.chat_is_staff())
);

drop policy if exists "chat_participants_update" on public.chat_participants;
create policy "chat_participants_update"
on public.chat_participants
for update
to authenticated
using (
  public.chat_can_access_conversation(conversation_id)
  and (user_id = auth.uid() or public.chat_is_staff())
)
with check (
  public.chat_can_access_conversation(conversation_id)
  and (user_id = auth.uid() or public.chat_is_staff())
);

drop policy if exists "chat_messages_select" on public.chat_messages;
create policy "chat_messages_select"
on public.chat_messages
for select
to authenticated
using (public.chat_can_access_conversation(conversation_id));

drop policy if exists "chat_messages_insert" on public.chat_messages;
create policy "chat_messages_insert"
on public.chat_messages
for insert
to authenticated
with check (
  public.chat_can_access_conversation(conversation_id)
  and sender_user_id = auth.uid()
);

drop policy if exists "chat_presence_select" on public.chat_presence;
create policy "chat_presence_select"
on public.chat_presence
for select
to authenticated
using (
  public.chat_is_staff()
  or user_id = auth.uid()
  or role in ('admin', 'seller')
);

drop policy if exists "chat_presence_insert" on public.chat_presence;
create policy "chat_presence_insert"
on public.chat_presence
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "chat_presence_update" on public.chat_presence;
create policy "chat_presence_update"
on public.chat_presence
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat_attachments_select" on storage.objects;
create policy "chat_attachments_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-attachments'
  and public.chat_can_access_storage_object(name)
);

drop policy if exists "chat_attachments_insert" on storage.objects;
create policy "chat_attachments_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-attachments'
  and public.chat_can_access_storage_object(name)
);

drop policy if exists "chat_attachments_update" on storage.objects;
create policy "chat_attachments_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'chat-attachments'
  and public.chat_can_access_storage_object(name)
)
with check (
  bucket_id = 'chat-attachments'
  and public.chat_can_access_storage_object(name)
);

drop policy if exists "chat_attachments_delete" on storage.objects;
create policy "chat_attachments_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-attachments'
  and public.chat_can_access_storage_object(name)
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_conversations'
  ) then
    alter publication supabase_realtime add table public.chat_conversations;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_presence'
  ) then
    alter publication supabase_realtime add table public.chat_presence;
  end if;
end $$;

notify pgrst, 'reload schema';
