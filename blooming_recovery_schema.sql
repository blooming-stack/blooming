-- Blooming: base segura para recuperação de acesso
-- Esta etapa prepara os campos; o envio real do código deve ser feito por backend/Edge Function.

alter table if exists blooming_access
  add column if not exists recovery_email text,
  add column if not exists recovery_phone text,
  add column if not exists recovery_enabled boolean not null default false;

create table if not exists blooming_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references blooming_access(id) on delete cascade,
  code_hash text not null,
  channel text not null check (channel in ('email','sms','whatsapp')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists blooming_recovery_codes_access_idx
  on blooming_recovery_codes(access_id, created_at desc);

alter table blooming_recovery_codes enable row level security;

-- Nenhum código de recuperação fica acessível diretamente ao cliente anônimo.
-- A emissão/validação deverá ocorrer por uma Edge Function com credencial de servidor.
