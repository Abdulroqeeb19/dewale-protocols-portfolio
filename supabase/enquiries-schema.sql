-- ============================================================
-- WhatsApp Agent Enquiries Table
-- Run this AFTER the main schema.sql
-- ============================================================

-- 5. Enquiries from WhatsApp Agent
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  type text not null default 'enquiry',
  service text not null default '',
  description text not null default '',
  budget text not null default '',
  location text not null default '',
  payment_preference text not null default 'discuss',
  payment_ref text,
  refund_accepted boolean default false,
  lead_source text not null default '',
  budget_amount integer default 0,
  status text not null default 'new',
  notes text default '',
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

-- Public may insert enquiries (from the WhatsApp widget)
drop policy if exists "public submit enquiries" on public.enquiries;
create policy "public submit enquiries" on public.enquiries
  for insert with check (true);

-- Only admin may read enquiries
drop policy if exists "authenticated read enquiries" on public.enquiries;
create policy "authenticated read enquiries" on public.enquiries
  for select using (auth.role() = 'authenticated');

-- Only admin may update enquiries (status, notes)
drop policy if exists "authenticated update enquiries" on public.enquiries;
create policy "authenticated update enquiries" on public.enquiries
  for update using (auth.role() = 'authenticated');

-- Only admin may delete enquiries
drop policy if exists "authenticated delete enquiries" on public.enquiries;
create policy "authenticated delete enquiries" on public.enquiries
  for delete using (auth.role() = 'authenticated');

-- Harden: scope to admin only
drop policy if exists "authenticated read enquiries" on public.enquiries;
create policy "authenticated read enquiries" on public.enquiries
  for select using (auth.role() = 'authenticated' and public.is_admin());

drop policy if exists "authenticated update enquiries" on public.enquiries;
create policy "authenticated update enquiries" on public.enquiries
  for update using (auth.role() = 'authenticated' and public.is_admin());

drop policy if exists "authenticated delete enquiries" on public.enquiries;
create policy "authenticated delete enquiries" on public.enquiries
  for delete using (auth.role() = 'authenticated' and public.is_admin());

-- Index for faster queries
create index if not exists idx_enquiries_status on public.enquiries (status);
create index if not exists idx_enquiries_created on public.enquiries (created_at desc);
create index if not exists idx_enquiries_type on public.enquiries (type);
