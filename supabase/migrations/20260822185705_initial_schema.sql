-- ============================================================================
-- Defensive cleanup: this specific remote project had a pre-existing, empty
-- `users` table from an earlier, unrelated setup attempt — almost certainly
-- tied to the leftover DATABASE_URL/DIRECT_URL (Prisma-pattern) env vars
-- found and dropped back in Module 0. Confirmed empty before this was added.
-- ============================================================================
drop table if exists public.users;-- ============================================================================
-- Migration: initial_schema
-- 7 core entities + all Step 1.5 triggers. document_versions is intentionally
-- excluded — its snapshot column is blocked on the Yjs persistence design
-- (Module 10). See backlog.md.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- workspaces
-- ----------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  owner_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_owner_id_idx on public.workspaces(owner_id);

-- ----------------------------------------------------------------------------
-- workspace_members
-- ----------------------------------------------------------------------------
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);

-- ----------------------------------------------------------------------------
-- invitations
-- ----------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  inviter_id uuid references public.users(id) on delete set null,
  invited_email text not null
    check (invited_email = lower(invited_email)),
  invited_user_id uuid references public.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index invitations_workspace_id_idx on public.invitations(workspace_id);
create index invitations_inviter_id_idx on public.invitations(inviter_id);
create index invitations_invited_user_id_idx on public.invitations(invited_user_id);

create unique index invitations_pending_unique_idx
  on public.invitations(workspace_id, invited_email)
  where status = 'pending';

-- ----------------------------------------------------------------------------
-- documents
-- ----------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  content text not null default '',
  creator_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_workspace_id_idx on public.documents(workspace_id);
create index documents_creator_id_idx on public.documents(creator_id);

-- ----------------------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  content text not null
    check (char_length(content) > 0 and char_length(content) <= 10000),
  created_at timestamptz not null default now()
);

create index messages_workspace_id_created_at_idx
  on public.messages(workspace_id, created_at desc);
create index messages_sender_id_idx on public.messages(sender_id);

-- ----------------------------------------------------------------------------
-- whiteboards
-- ----------------------------------------------------------------------------
create table public.whiteboards (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  state jsonb not null default '{"version": 1, "objects": []}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Trigger 1 — auth.users -> public.users
-- Fails loudly, on purpose, if auth.users.email or the name in signup
-- metadata is null/missing — no COALESCE, no fallback. A broken/incomplete
-- signup should never produce a broken profile row.
-- ============================================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data ->> 'name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Trigger 2 — set_updated_at()
-- ============================================================================
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.whiteboards
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Trigger 3 — Ownership consistency invariant
-- Every workspace must have exactly one workspace_members row with
-- role = 'owner', and that row's user_id must equal workspaces.owner_id.
-- DEFERRABLE INITIALLY DEFERRED so multi-statement transactions (workspace
-- creation, ownership transfer) can pass through temporarily-inconsistent
-- states and only get validated once, at COMMIT.
-- ============================================================================
create function public.check_ownership_invariant()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_workspace_id uuid;
  owner_count integer;
  expected_owner_id uuid;
begin
  if TG_TABLE_NAME = 'workspaces' then
    if TG_OP = 'DELETE' then
      return old;
    end if;

    target_workspace_id := new.id;
    expected_owner_id := new.owner_id;
  else
    target_workspace_id := coalesce(new.workspace_id, old.workspace_id);

    select w.owner_id
      into expected_owner_id
    from public.workspaces w
    where w.id = target_workspace_id;

    -- Workspace was deleted as part of a cascade.
    -- Its ownership invariant no longer applies.
    if expected_owner_id is null then
      return coalesce(new, old);
    end if;
  end if;

  select count(*)
    into owner_count
  from public.workspace_members
  where workspace_id = target_workspace_id
    and role = 'owner';

  if owner_count != 1
     or not exists (
       select 1
       from public.workspace_members
       where workspace_id = target_workspace_id
         and role = 'owner'
         and user_id = expected_owner_id
     )
  then
    raise exception
      'Ownership invariant violated for workspace %: expected exactly one owner membership matching workspaces.owner_id',
      target_workspace_id;
  end if;

  return coalesce(new, old);
end;
$$;

create constraint trigger workspaces_ownership_check
  after insert or update of owner_id on public.workspaces
  deferrable initially deferred
  for each row execute function public.check_ownership_invariant();

create constraint trigger workspace_members_ownership_check
  after insert or update or delete on public.workspace_members
  deferrable initially deferred
  for each row execute function public.check_ownership_invariant();


