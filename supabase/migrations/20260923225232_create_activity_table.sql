create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  event_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_workspace_id_created_at_id_idx
  on public.activity(workspace_id, created_at desc, id desc);