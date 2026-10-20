-- BLOOMING 0.1 — fundação de acesso
-- Execute no Supabase SQL Editor antes de usar o aplicativo.

create extension if not exists pgcrypto;

create table if not exists public.blooming_access (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  name_key text not null unique,
  code_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.blooming_access enable row level security;

-- 0.1 usa a chave publicável/anon apenas para o protótipo funcional.
-- As políticas abaixo permitem o fluxo de criação/login desta etapa.
-- Em seguida, a autenticação será migrada para um mecanismo de servidor/Edge Function,
-- evitando que hashes de códigos sejam consultáveis diretamente pelo cliente.
drop policy if exists "blooming_access_insert" on public.blooming_access;
drop policy if exists "blooming_access_select" on public.blooming_access;

create policy "blooming_access_insert"
on public.blooming_access
for insert
to anon, authenticated
with check (true);

create policy "blooming_access_select"
on public.blooming_access
for select
to anon, authenticated
using (true);

-- Verificação rápida:
-- select id, display_name, name_key, created_at from public.blooming_access order by created_at desc;
