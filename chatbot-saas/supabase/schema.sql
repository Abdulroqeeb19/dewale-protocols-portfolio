-- ChatBot Pro — Enhanced Multi-tenant Schema (1000+ businesses)
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. BUSINESSES TABLE
-- ============================================================
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Business',
  slug text not null unique,
  email text default '',
  phone text default '',
  location text default '',
  description text default '',
  chatbot_config jsonb not null default '{
    "greeting": "Hello! How can we help you today?",
    "services": [],
    "faq": [],
    "primaryColor": "#6366f1",
    "position": "bottom-right"
  }'::jsonb,
  is_active boolean default true,
  plan text default 'free' check (plan in ('free', 'pro', 'business')),
  monthly_leads_used integer default 0,
  monthly_leads_limit integer default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

-- ============================================================
-- 2. LEADS TABLE (with abuse tracking)
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text default '',
  service text default '',
  message text default '',
  source text default 'chatbot',
  status text default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'spam')),
  ip_address text default '',
  user_agent text default '',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- ============================================================
-- 3. API KEYS (for programmatic access)
-- ============================================================
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  key_hash text not null unique,
  name text not null default 'API Key',
  permissions jsonb default '["read:leads"]'::jsonb,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.api_keys enable row level security;

-- ============================================================
-- 4. AUDIT LOG (security tracking)
-- ============================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  ip_address text default '',
  created_at timestamptz not null default now()
);

-- No RLS — admin-only via service role

-- ============================================================
-- 5. RATE LIMIT TRACKING
-- ============================================================
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  action text not null,
  count integer default 1,
  window_start timestamptz default now(),
  unique(identifier, action)
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Businesses: owner CRUD
drop policy if exists "owner manage businesses" on public.businesses;
create policy "owner manage businesses" on public.businesses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Businesses: public read (for widget)
drop policy if exists "public read active businesses" on public.businesses;
create policy "public read active businesses" on public.businesses
  for select using (is_active = true);

-- Leads: owner reads their leads
drop policy if exists "owner read leads" on public.leads;
create policy "owner read leads" on public.leads
  for select using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- Leads: public insert (widget submissions)
drop policy if exists "public insert leads" on public.leads;
create policy "public insert leads" on public.leads
  for insert with check (true);

-- Leads: owner update/delete
drop policy if exists "owner manage leads" on public.leads;
create policy "owner manage leads" on public.leads
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- API keys: owner manage
drop policy if exists "owner manage api keys" on public.api_keys;
create policy "owner manage api keys" on public.api_keys
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- ============================================================
-- INDEXES (optimized for 1000+ businesses, 100k+ leads)
-- ============================================================
create index if not exists idx_businesses_slug on public.businesses (slug);
create index if not exists idx_businesses_owner on public.businesses (owner_id);
create index if not exists idx_businesses_active on public.businesses (is_active) where is_active = true;
create index if not exists idx_businesses_plan on public.businesses (plan);

create index if not exists idx_leads_business on public.leads (business_id);
create index if not exists idx_leads_created on public.leads (created_at desc);
create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_business_created on public.leads (business_id, created_at desc);
create index if not exists idx_leads_email on public.leads (email);

create index if not exists idx_api_keys_hash on public.api_keys (key_hash);
create index if not exists idx_api_keys_business on public.api_keys (business_id);

create index if not exists idx_audit_log_business on public.audit_log (business_id);
create index if not exists idx_audit_log_created on public.audit_log (created_at desc);
create index if not exists idx_audit_log_action on public.audit_log (action);

create index if not exists idx_rate_limits_identifier on public.rate_limits (identifier, action);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create business on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.businesses (owner_id, name, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    lower(replace(replace(replace(
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      ' ', '-'), '.', ''), '_', '-'))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_updated_at on public.businesses;
create trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.update_updated_at();

-- Monthly leads limit check
create or replace function public.check_leads_limit()
returns trigger language plpgsql security definer as $$
declare
  biz record;
  lead_count integer;
begin
  select * into biz from public.businesses where id = new.business_id;

  if biz is null then
    raise exception 'Business not found';
  end if;

  select count(*) into lead_count
  from public.leads
  where business_id = new.business_id
    and created_at >= date_trunc('month', now());

  if lead_count >= biz.monthly_leads_limit then
    raise exception 'Monthly leads limit reached. Upgrade your plan.';
  end if;

  return new;
end;
$$;

drop trigger if exists check_leads_before_insert on public.leads;
create trigger check_leads_before_insert
  before insert on public.leads
  for each row execute function public.check_leads_limit();

-- ============================================================
-- CLEANUP: Auto-delete old rate limits (run daily)
-- ============================================================
create or replace function public.cleanup_rate_limits()
returns void language plpgsql security definer as $$
begin
  delete from public.rate_limits where window_start < now() - interval '1 hour';
end;
$$;
