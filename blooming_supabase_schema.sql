-- BLOOMING 0.7 — acesso + perfis + mídia + seguidores + publicações + curtidas + comentários
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
  cover_url text,
  created_at timestamptz not null default now()
);

alter table public.blooming_profiles add column if not exists cover_url text;

create table if not exists public.blooming_follows (
  id uuid primary key default gen_random_uuid(),
  follower_profile_id uuid not null references public.blooming_profiles(id) on delete cascade,
  following_profile_id uuid not null references public.blooming_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blooming_follows_no_self check (follower_profile_id <> following_profile_id),
  constraint blooming_follows_unique unique (follower_profile_id, following_profile_id)
);
create index if not exists blooming_follows_follower_idx on public.blooming_follows(follower_profile_id);
create index if not exists blooming_follows_following_idx on public.blooming_follows(following_profile_id);

create table if not exists public.blooming_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.blooming_profiles(id) on delete cascade,
  caption text not null default '',
  media_url text,
  media_type text,
  created_at timestamptz not null default now(),
  constraint blooming_posts_media_type check (media_type is null or media_type in ('image','video'))
);
create index if not exists blooming_posts_profile_idx on public.blooming_posts(profile_id, created_at desc);

create table if not exists public.blooming_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blooming_posts(id) on delete cascade,
  profile_id uuid not null references public.blooming_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blooming_post_likes_unique unique (post_id, profile_id)
);
create index if not exists blooming_post_likes_post_idx on public.blooming_post_likes(post_id);
create index if not exists blooming_post_likes_profile_idx on public.blooming_post_likes(profile_id);

create table if not exists public.blooming_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blooming_posts(id) on delete cascade,
  profile_id uuid not null references public.blooming_profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint blooming_comments_body_not_empty check (length(trim(body)) > 0)
);
create index if not exists blooming_comments_post_idx on public.blooming_comments(post_id, created_at);
create index if not exists blooming_comments_profile_idx on public.blooming_comments(profile_id);

alter table public.blooming_access enable row level security;
alter table public.blooming_profiles enable row level security;
alter table public.blooming_follows enable row level security;
alter table public.blooming_posts enable row level security;
alter table public.blooming_post_likes enable row level security;
alter table public.blooming_comments enable row level security;

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

drop policy if exists "blooming_follows_insert" on public.blooming_follows;
drop policy if exists "blooming_follows_select" on public.blooming_follows;
drop policy if exists "blooming_follows_delete" on public.blooming_follows;
create policy "blooming_follows_insert" on public.blooming_follows for insert to anon, authenticated with check (true);
create policy "blooming_follows_select" on public.blooming_follows for select to anon, authenticated using (true);
create policy "blooming_follows_delete" on public.blooming_follows for delete to anon, authenticated using (true);

drop policy if exists "blooming_posts_insert" on public.blooming_posts;
drop policy if exists "blooming_posts_select" on public.blooming_posts;
drop policy if exists "blooming_posts_update" on public.blooming_posts;
drop policy if exists "blooming_posts_delete" on public.blooming_posts;
create policy "blooming_posts_insert" on public.blooming_posts for insert to anon, authenticated with check (true);
create policy "blooming_posts_select" on public.blooming_posts for select to anon, authenticated using (true);
create policy "blooming_posts_update" on public.blooming_posts for update to anon, authenticated using (true) with check (true);
create policy "blooming_posts_delete" on public.blooming_posts for delete to anon, authenticated using (true);

drop policy if exists "blooming_post_likes_insert" on public.blooming_post_likes;
drop policy if exists "blooming_post_likes_select" on public.blooming_post_likes;
drop policy if exists "blooming_post_likes_delete" on public.blooming_post_likes;
create policy "blooming_post_likes_insert" on public.blooming_post_likes for insert to anon, authenticated with check (true);
create policy "blooming_post_likes_select" on public.blooming_post_likes for select to anon, authenticated using (true);
create policy "blooming_post_likes_delete" on public.blooming_post_likes for delete to anon, authenticated using (true);

drop policy if exists "blooming_comments_insert" on public.blooming_comments;
drop policy if exists "blooming_comments_select" on public.blooming_comments;
drop policy if exists "blooming_comments_delete" on public.blooming_comments;
create policy "blooming_comments_insert" on public.blooming_comments for insert to anon, authenticated with check (true);
create policy "blooming_comments_select" on public.blooming_comments for select to anon, authenticated using (true);
create policy "blooming_comments_delete" on public.blooming_comments for delete to anon, authenticated using (true);

-- Storage: crie o bucket 'blooming-media' no painel do Supabase como público.
