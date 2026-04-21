import { NextResponse } from 'next/server'

// POST /api/setup-db — creates all tables via Supabase Management API
// Only needed once. Remove after first successful run.
export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const sql = `
    create extension if not exists "uuid-ossp";

    create table if not exists workspaces (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      description text,
      status text not null default 'draft' check (status in ('live', 'draft', 'private')),
      owner_id uuid not null default uuid_generate_v4(),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists datasets (
      id uuid primary key default uuid_generate_v4(),
      workspace_id uuid not null references workspaces(id) on delete cascade,
      name text not null,
      original_filename text not null,
      row_count integer not null default 0,
      column_count integer not null default 0,
      columns jsonb not null default '[]',
      storage_path text not null default '',
      uploaded_at timestamptz not null default now()
    );

    create table if not exists dataset_rows (
      id uuid primary key default uuid_generate_v4(),
      dataset_id uuid not null references datasets(id) on delete cascade,
      row_index integer not null,
      data jsonb not null default '{}'
    );

    create index if not exists dataset_rows_dataset_id_idx on dataset_rows(dataset_id);

    create table if not exists charts (
      id uuid primary key default uuid_generate_v4(),
      workspace_id uuid not null references workspaces(id) on delete cascade,
      dataset_id uuid references datasets(id) on delete set null,
      title text not null,
      subtitle text,
      type text not null default 'bar' check (type in ('bar', 'line', 'area', 'donut', 'pie', 'scatter')),
      config jsonb not null default '{}',
      size text not null default 'md' check (size in ('sm', 'md', 'lg')),
      palette text not null default 'violet',
      position integer not null default 0,
      created_at timestamptz not null default now()
    );

    create table if not exists workspace_members (
      id uuid primary key default uuid_generate_v4(),
      workspace_id uuid not null references workspaces(id) on delete cascade,
      user_id uuid,
      email text not null,
      role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
      joined_at timestamptz not null default now(),
      unique(workspace_id, email)
    );

    alter table workspaces enable row level security;
    alter table datasets enable row level security;
    alter table dataset_rows enable row level security;
    alter table charts enable row level security;
    alter table workspace_members enable row level security;

    do $$ begin
      if not exists (select 1 from pg_policies where tablename='workspaces' and policyname='allow_all_workspaces') then
        create policy "allow_all_workspaces" on workspaces for all using (true) with check (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='datasets' and policyname='allow_all_datasets') then
        create policy "allow_all_datasets" on datasets for all using (true) with check (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='dataset_rows' and policyname='allow_all_dataset_rows') then
        create policy "allow_all_dataset_rows" on dataset_rows for all using (true) with check (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='charts' and policyname='allow_all_charts') then
        create policy "allow_all_charts" on charts for all using (true) with check (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='workspace_members' and policyname='allow_all_workspace_members') then
        create policy "allow_all_workspace_members" on workspace_members for all using (true) with check (true);
      end if;
    end $$;
  `

  const res = await fetch(`${url}/rest/v1/`, {
    method: 'GET',
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })

  // Use pg REST endpoint workaround via SQL
  const pgRes = await fetch(`${url}/pg`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  return NextResponse.json({ status: pgRes.status, ok: pgRes.ok })
}
