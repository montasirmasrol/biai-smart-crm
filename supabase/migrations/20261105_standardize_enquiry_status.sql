begin;

do $$
declare
  current_labels text[];
begin
  select array_agg(enumlabel::text order by enumsortorder)
    into current_labels
  from pg_enum
  where enumtypid = 'public.enquiry_status'::regtype;

  if current_labels is distinct from array[
    'new',
    'contacted',
    'qualified',
    'proposal',
    'won',
    'lost'
  ]::text[] then
    raise exception 'Unexpected public.enquiry_status labels: %', current_labels;
  end if;
end
$$;

create type public.enquiry_status_v2 as enum (
  'new',
  'contacted',
  'interested',
  'paid',
  'lost'
);

alter table public.enquiries
  alter column status drop default;

alter table public.enquiries
  alter column status type public.enquiry_status_v2
  using (
    case status::text
      when 'new' then 'new'
      when 'contacted' then 'contacted'
      when 'qualified' then 'interested'
      when 'proposal' then 'interested'
      when 'won' then 'paid'
      when 'lost' then 'lost'
    end
  )::public.enquiry_status_v2;

drop type public.enquiry_status;
alter type public.enquiry_status_v2 rename to enquiry_status;

alter table public.enquiries
  alter column status set default 'new'::public.enquiry_status;

commit;
