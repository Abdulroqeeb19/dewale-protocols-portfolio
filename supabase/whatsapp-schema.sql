-- ============================================================
-- WhatsApp Cloud API conversations table
-- Run this AFTER enquiries-schema.sql
-- ============================================================

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null default '',
  flow_state text not null default 'greeting',
  collected_data jsonb not null default '{}'::jsonb,
  last_message text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_conversations enable row level security;

-- Webhook inserts/updates conversations (service role)
-- Admin reads via authenticated role

-- Only admin may read conversations
drop policy if exists "authenticated read whatsapp conversations" on public.whatsapp_conversations;
create policy "authenticated read whatsapp conversations" on public.whatsapp_conversations
  for select using (auth.role() = 'authenticated' and public.is_admin());

-- Only admin may update conversations (for manual reply)
drop policy if exists "authenticated update whatsapp conversations" on public.whatsapp_conversations;
create policy "authenticated update whatsapp conversations" on public.whatsapp_conversations
  for update using (auth.role() = 'authenticated' and public.is_admin());

-- Only admin may delete conversations
drop policy if exists "authenticated delete whatsapp conversations" on public.whatsapp_conversations;
create policy "authenticated delete whatsapp conversations" on public.whatsapp_conversations
  for delete using (auth.role() = 'authenticated' and public.is_admin());

-- Service role (webhook) uses bypass RLS — no policy needed

create index if not exists idx_wa_conversations_phone on public.whatsapp_conversations (phone);
create index if not exists idx_wa_conversations_updated on public.whatsapp_conversations (updated_at desc);
create index if not exists idx_wa_conversations_status on public.whatsapp_conversations (status);
