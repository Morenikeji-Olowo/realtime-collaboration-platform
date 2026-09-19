-- ============================================================================
-- Migration: document_versions_and_bytea_content
-- Module 14 (Yjs) prerequisite: documents.content changes from text to bytea
-- to hold encoded Yjs snapshots. document_versions is finally unblocked,
-- matching the design locked back in Module 1 schema design.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- documents.content: text -> bytea
-- Every existing row is the empty-string default -- no real content has ever
-- been written. The USING clause deliberately does not interpret the old
-- text value at all; it replaces every row with an explicit, unambiguous
-- zero-length bytea via decode('', 'hex').
--
-- Drop the existing TEXT default first because PostgreSQL cannot automatically
-- cast that default expression during the type change.
-- ----------------------------------------------------------------------------
alter table public.documents
  alter column content drop default;

alter table public.documents
  alter column content type bytea
  using decode('', 'hex');

alter table public.documents
  alter column content set default decode('', 'hex');

-- ----------------------------------------------------------------------------
-- document_versions
-- ----------------------------------------------------------------------------
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content bytea not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index document_versions_document_id_created_at_idx
  on public.document_versions(document_id, created_at desc);

create index document_versions_created_by_idx
  on public.document_versions(created_by);