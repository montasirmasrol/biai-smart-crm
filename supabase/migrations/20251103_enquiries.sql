-- Schema contract for BIAI Smart CRM.
-- This matches the application model used by src/types/crm.ts and src/lib/data/enquiries.ts.

create type public.enquiry_status as enum (
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost'
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  source text,
  interest text,
  status public.enquiry_status not null default 'new',
  original_message text not null,
  preferred_language text,
  follow_up_at timestamptz,
  last_contacted_at timestamptz,
  ai_summary text,
  ai_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists enquiries_status_idx on public.enquiries (status);
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_source_idx on public.enquiries (source);

alter table public.enquiries enable row level security;

create policy "Authenticated users can view enquiries"
  on public.enquiries
  for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert enquiries"
  on public.enquiries
  for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update enquiries"
  on public.enquiries
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Authenticated users can delete enquiries"
  on public.enquiries
  for delete
  using (auth.uid() is not null);
