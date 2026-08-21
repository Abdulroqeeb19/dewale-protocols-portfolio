-- ============================================================
-- Portfolio admin content store — run this once in the
-- Supabase SQL editor for your project.
--
-- AFTER running, create your admin login:
--   Supabase Dashboard -> Authentication -> Users -> Add user
--   (use the email/password from your .env VITE_ADMIN_EMAIL /
--    VITE_ADMIN_PASSWORD, then change the password after login)
-- ============================================================

-- 1. Single-row JSON content store
create table if not exists public.site_content (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Anyone (public site) may read the content
drop policy if exists "public read site content" on public.site_content;
create policy "public read site content" on public.site_content
  for select using (true);

-- Only signed-in users (the admin) may modify content
drop policy if exists "authenticated manage site content" on public.site_content;
create policy "authenticated manage site content" on public.site_content
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed the row (empty object; the site merges defaults over it)
insert into public.site_content (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- 2. Public image bucket for brand / project / article images
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

drop policy if exists "public read portfolio images" on storage.objects;
create policy "public read portfolio images" on storage.objects
  for select using (bucket_id = 'portfolio-images');

drop policy if exists "authenticated upload portfolio images" on storage.objects;
create policy "authenticated upload portfolio images" on storage.objects
  for insert with check (bucket_id = 'portfolio-images' and auth.role() = 'authenticated');

drop policy if exists "authenticated update portfolio images" on storage.objects;
create policy "authenticated update portfolio images" on storage.objects
  for update using (bucket_id = 'portfolio-images' and auth.role() = 'authenticated');

drop policy if exists "authenticated delete portfolio images" on storage.objects;
create policy "authenticated delete portfolio images" on storage.objects
  for delete using (bucket_id = 'portfolio-images' and auth.role() = 'authenticated');

-- 3. Contact messages from the site contact form
create extension if not exists "pgcrypto";

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Visitors may submit messages
drop policy if exists "public submit contact messages" on public.contact_messages;
create policy "public submit contact messages" on public.contact_messages
  for insert with check (true);

-- Only signed-in admins may read / delete them
drop policy if exists "authenticated read contact messages" on public.contact_messages;
create policy "authenticated read contact messages" on public.contact_messages
  for select using (auth.role() = 'authenticated');

drop policy if exists "authenticated delete contact messages" on public.contact_messages;
create policy "authenticated delete contact messages" on public.contact_messages
  for delete using (auth.role() = 'authenticated');

-- ============================================================
-- 4. HARDENING (recommended) — scope admin powers to ONE user.
--    Run this AFTER creating your admin user (Authentication →
--    Users). Replace 'dewaleprotocols@gmail.com' with your admin
--    email if it differs, otherwise you will lock yourself out.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer as $$
  select auth.jwt() ->> 'email' = 'dewaleprotocols@gmail.com';
$$;

-- site_content: only the admin may modify
drop policy if exists "authenticated manage site content" on public.site_content;
create policy "authenticated manage site content" on public.site_content
  for all using (auth.role() = 'authenticated' and public.is_admin())
  with check (auth.role() = 'authenticated' and public.is_admin());

-- contact_messages: only the admin may read / delete
drop policy if exists "authenticated read contact messages" on public.contact_messages;
create policy "authenticated read contact messages" on public.contact_messages
  for select using (auth.role() = 'authenticated' and public.is_admin());

drop policy if exists "authenticated delete contact messages" on public.contact_messages;
create policy "authenticated delete contact messages" on public.contact_messages
  for delete using (auth.role() = 'authenticated' and public.is_admin());

-- storage: only the admin may upload / update / delete images
drop policy if exists "authenticated upload portfolio images" on storage.objects;
create policy "authenticated upload portfolio images" on storage.objects
  for insert with check (bucket_id = 'portfolio-images' and auth.role() = 'authenticated' and public.is_admin());

drop policy if exists "authenticated update portfolio images" on storage.objects;
create policy "authenticated update portfolio images" on storage.objects
  for update using (bucket_id = 'portfolio-images' and auth.role() = 'authenticated' and public.is_admin());

drop policy if exists "authenticated delete portfolio images" on storage.objects;
create policy "authenticated delete portfolio images" on storage.objects
  for delete using (bucket_id = 'portfolio-images' and auth.role() = 'authenticated' and public.is_admin());
