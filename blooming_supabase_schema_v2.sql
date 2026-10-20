-- BLOOMING v2 — schema alinhado ao banco atual
-- IDs de acesso: UUID. IDs de perfil: TEXT.
-- Este arquivo é para novas instalações e preserva o modelo atual.
create extension if not exists pgcrypto;

create table if not exists public.blooming_access (id uuid primary key default gen_random_uuid(), display_name text not null, name_key text not null unique, code_hash text not null, created_at timestamptz not null default now());

create table if not exists public.blooming_profiles (id text primary key, account_id uuid references public.blooming_access(id) on delete cascade, nome text not null, username text, bio text default '', loc text default '', cor text default '#E8336F', emo text default '🌸', foto text default '', capa text default '', verificado boolean default false, privada boolean default false, seg integer default 0, sgd integer default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), display_name text, color text, emoji text, avatar_url text, cover_url text);

create index if not exists blooming_profiles_account_idx on public.blooming_profiles(account_id);
create unique index if not exists blooming_profiles_username_lower_idx on public.blooming_profiles(lower(username)) where username is not null and username <> '';

create table if not exists public.blooming_follows (id uuid primary key default gen_random_uuid(), follower_profile_id text not null references public.blooming_profiles(id) on delete cascade, following_profile_id text not null references public.blooming_profiles(id) on delete cascade, created_at timestamptz not null default now(), constraint blooming_follows_no_self check (follower_profile_id <> following_profile_id), constraint blooming_follows_unique unique(follower_profile_id,following_profile_id));
create index if not exists blooming_follows_follower_idx on public.blooming_follows(follower_profile_id);
create index if not exists blooming_follows_following_idx on public.blooming_follows(following_profile_id);

create table if not exists public.blooming_posts (id uuid primary key default gen_random_uuid(), profile_id text not null references public.blooming_profiles(id) on delete cascade, caption text not null default '', media_url text, media_type text, created_at timestamptz not null default now(), constraint blooming_posts_media_type check(media_type is null or media_type in ('image','video')));
create index if not exists blooming_posts_profile_idx on public.blooming_posts(profile_id,created_at desc);

create table if not exists public.blooming_post_likes (id uuid primary key default gen_random_uuid(), post_id uuid not null references public.blooming_posts(id) on delete cascade, profile_id text not null references public.blooming_profiles(id) on delete cascade, created_at timestamptz not null default now(), constraint blooming_post_likes_unique unique(post_id,profile_id));
create index if not exists blooming_post_likes_post_idx on public.blooming_post_likes(post_id);
create index if not exists blooming_post_likes_profile_idx on public.blooming_post_likes(profile_id);

create table if not exists public.blooming_comments (id uuid primary key default gen_random_uuid(), post_id uuid not null references public.blooming_posts(id) on delete cascade, profile_id text not null references public.blooming_profiles(id) on delete cascade, body text not null, created_at timestamptz not null default now(), constraint blooming_comments_body_not_empty check(length(trim(body))>0));
create index if not exists blooming_comments_post_idx on public.blooming_comments(post_id,created_at);
create index if not exists blooming_comments_profile_idx on public.blooming_comments(profile_id);

create table if not exists public.blooming_notifications (id uuid primary key default gen_random_uuid(), recipient_profile_id text not null references public.blooming_profiles(id) on delete cascade, actor_profile_id text not null references public.blooming_profiles(id) on delete cascade, type text not null check(type in ('follow','like','comment')), post_id uuid references public.blooming_posts(id) on delete cascade, comment_id uuid references public.blooming_comments(id) on delete cascade, created_at timestamptz not null default now(), read_at timestamptz);
create index if not exists blooming_notifications_recipient_idx on public.blooming_notifications(recipient_profile_id,created_at desc);
create index if not exists blooming_notifications_unread_idx on public.blooming_notifications(recipient_profile_id,read_at,created_at desc);

alter table public.blooming_access enable row level security;
alter table public.blooming_profiles enable row level security;
alter table public.blooming_follows enable row level security;
alter table public.blooming_posts enable row level security;
alter table public.blooming_post_likes enable row level security;
alter table public.blooming_comments enable row level security;
alter table public.blooming_notifications enable row level security;

-- Políticas abertas mantidas porque o protótipo atual usa cliente anon.
drop policy if exists blooming_access_insert on public.blooming_access;
drop policy if exists blooming_access_select on public.blooming_access;
create policy blooming_access_insert on public.blooming_access for insert to anon,authenticated with check(true);
create policy blooming_access_select on public.blooming_access for select to anon,authenticated using(true);

drop policy if exists blooming_profiles_insert on public.blooming_profiles;
drop policy if exists blooming_profiles_select on public.blooming_profiles;
drop policy if exists blooming_profiles_update on public.blooming_profiles;
drop policy if exists blooming_profiles_delete on public.blooming_profiles;
create policy blooming_profiles_insert on public.blooming_profiles for insert to anon,authenticated with check(true);
create policy blooming_profiles_select on public.blooming_profiles for select to anon,authenticated using(true);
create policy blooming_profiles_update on public.blooming_profiles for update to anon,authenticated using(true) with check(true);
create policy blooming_profiles_delete on public.blooming_profiles for delete to anon,authenticated using(true);

-- O bucket 'blooming-media' deve existir no Storage como público.