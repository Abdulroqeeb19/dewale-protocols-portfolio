-- ChatBot Pro — Multi-tenant Schema
-- Run this in Supabase SQL Editor

-- 1. Businesses table
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
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

-- Owner CRUD
drop policy if exists "owner manage businesses" on public.businesses;
create policy "owner manage businesses" on public.businesses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Public read for widget config
drop policy if exists "public read businesses" on public.businesses;
create policy "public read businesses" on public.businesses
  for select using (true);

-- 2. Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text default '',
  service text default '',
  message text default '',
  source text default 'chatbot',
  status text default 'new',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Owner reads their leads
drop policy if exists "owner read leads" on public.leads;
create policy "owner read leads" on public.leads
  for select using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- Public insert (widget submissions)
drop policy if exists "public insert leads" on public.leads;
create policy "public insert leads" on public.leads
  for insert with check (true);

-- Owner update/delete their leads
drop policy if exists "owner manage leads" on public.leads;
create policy "owner manage leads" on public.leads
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- 3. Indexes
create index if not exists idx_businesses_slug on public.businesses (slug);
create index if not exists idx_businesses_owner on public.businesses (owner_id);
create index if not exists idx_leads_business on public.leads (business_id);
create index if not exists idx_leads_created on public.leads (created_at desc);
create index if not exists idx_leads_status on public.leads (status);

-- 4. Auto-create business on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.businesses (owner_id, name, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    lower(replace(replace(replace(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), ' ', '-'), '.', ''), '_', '-'))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
