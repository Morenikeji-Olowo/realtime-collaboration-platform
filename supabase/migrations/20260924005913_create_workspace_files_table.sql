create table public.workspace_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  uploaded_by uuid references public.users(id) on delete set null,
  original_name text not null,
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspace_files_workspace_id_created_at_id_idx
  on public.workspace_files(workspace_id, created_at desc, id desc);

alter table public.workspace_files disable row level security;