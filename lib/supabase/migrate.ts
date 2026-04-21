// Run this once to set up the database: npx ts-node lib/supabase/migrate.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const statements = [
  `create extension if not exists "uuid-ossp"`,
  `create table if not exists workspaces (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    status text not null default 'draft' check (status in ('live', 'draft', 'private')),
    owner_id uuid not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists datasets (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    name text not null,
    original_filename text not null,
    row_count integer not null default 0,
    column_count integer not null default 0,
    columns jsonb not null default '[]',
    storage_path text not null default '',
    uploaded_at timestamptz not null default now()
  )`,
  `create table if not exists dataset_rows (
    id uuid primary key default uuid_generate_v4(),
    dataset_id uuid not null references datasets(id) on delete cascade,
    row_index integer not null,
    data jsonb not null default '{}'
  )`,
  `create index if not exists dataset_rows_dataset_id_idx on dataset_rows(dataset_id)`,
  `create table if not exists charts (
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
  )`,
  `create table if not exists workspace_members (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    user_id uuid,
    email text not null,
    role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
    joined_at timestamptz not null default now(),
    unique(workspace_id, email)
  )`,
]

async function migrate() {
  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (error) console.error('Error:', error.message, '\nSQL:', sql.slice(0, 60))
    else console.log('OK:', sql.slice(0, 60))
  }
}

migrate()
