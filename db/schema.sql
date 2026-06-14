-- Company Brain — production schema (Supabase / Postgres).
-- Paste this whole block into the Supabase SQL Editor and Run.
-- Data model mirrors src/lib/store.ts (§4.5 of the execution plan).
-- RLS is enabled with no policies: only the server-side secret key (service_role,
-- which bypasses RLS) can read/write. The public/anon key cannot touch these tables.
-- (User-scoped RLS policies get added when we wire Supabase Auth.)

create table if not exists orgs (
  id text primary key,
  name text not null,
  slug text not null,
  plan text not null default 'free',
  mcp_token text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists sources (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  type text not null,
  ref text not null,
  sync_state text not null default 'idle',
  last_synced_at timestamptz
);
create index if not exists sources_org_idx on sources(org_id);

create table if not exists documents (
  id text primary key,
  source_id text not null references sources(id) on delete cascade,
  external_id text not null,
  title text not null,
  content text not null,
  content_hash text not null,
  fetched_at timestamptz not null default now()
);
create index if not exists documents_source_idx on documents(source_id);

create table if not exists skills (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  status text not null default 'draft',
  current_version_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists skills_org_idx on skills(org_id);

create table if not exists skill_versions (
  id text primary key,
  skill_id text not null references skills(id) on delete cascade,
  body_md text not null,
  description text not null default '',
  title text not null,
  generated_from jsonb not null default '[]'::jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  approved_by text,
  approved_at timestamptz
);
create index if not exists skill_versions_skill_idx on skill_versions(skill_id);

create table if not exists staleness_flags (
  id text primary key,
  skill_id text not null references skills(id) on delete cascade,
  document_id text not null,
  reason text not null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists staleness_flags_skill_idx on staleness_flags(skill_id);

alter table orgs enable row level security;
alter table sources enable row level security;
alter table documents enable row level security;
alter table skills enable row level security;
alter table skill_versions enable row level security;
alter table staleness_flags enable row level security;
