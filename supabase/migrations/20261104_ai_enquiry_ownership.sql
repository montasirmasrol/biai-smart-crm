-- Add AI-extracted email and per-user ownership to existing enquiries.
-- Existing rows with a NULL user_id must be assigned to an account before they
-- are visible under the ownership policies below. No rows are deleted.

alter table public.enquiries
  add column if not exists email text,
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

 drop policy if exists "Authenticated users can view enquiries" on public.enquiries;
 drop policy if exists "Authenticated users can insert enquiries" on public.enquiries;
 drop policy if exists "Authenticated users can update enquiries" on public.enquiries;
 drop policy if exists "Authenticated users can delete enquiries" on public.enquiries;

create policy "Users can view their own enquiries"
  on public.enquiries
  for select
  using (user_id = auth.uid());

create policy "Users can insert their own enquiries"
  on public.enquiries
  for insert
  with check (user_id = auth.uid());

create policy "Users can update their own enquiries"
  on public.enquiries
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own enquiries"
  on public.enquiries
  for delete
  using (user_id = auth.uid());
