-- BLOOMING 0.2 — acesso + perfis
create extension if not exists pgcrypto;

create table if not exists public.blooming_access (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  name_key text not null unique,
  code_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.blooming_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.blooming_access(id) on delete cascade,
  display_name text not null,
  username text not null unique,
  bio text not null default '',
  color text not null default '#E83370',
  emoji text not null default '🌷',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.blooming_access enable row level security;
alter table public.blooming_profiles enable row level security;

drop policy if exists "blooming_access_insert" on public.blooming_access;
drop policy if exists "blooming_access_select" on public.blooming_access;
create policy "blooming_access_insert" on public.blooming_access for insert to anon, authenticated with check (true);
create policy "blooming_access_select" on public.blooming_access for select to anon, authenticated using (true);

drop policy if exists "blooming_profiles_insert" on public.blooming_profiles;
drop policy if exists "blooming_profiles_select" on public.blooming_profiles;
drop policy if exists "blooming_profiles_update" on public.blooming_profiles;
drop policy if exists "blooming_profiles_delete" on public.blooming_profiles;
create policy "blooming_profiles_insert" on public.blooming_profiles for insert to anon, authenticated with check (true);
create policy "blooming_profiles_select" on public.blooming_profiles for select to anon, authenticated using (true);
create policy "blooming_profiles_update" on public.blooming_profiles for update to anon, authenticated using (true) with check (true);
create policy "blooming_profiles_delete" on public.blooming_profiles for delete to anon, authenticated using (true);
