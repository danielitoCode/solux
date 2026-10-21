-- SOLUX: origen e intención comercial en leads (formularios públicos)
alter table public.reservations
  add column if not exists source text not null default 'direct',
  add column if not exists intent text not null default 'install';

alter table public.support_tickets
  add column if not exists source text not null default 'direct',
  add column if not exists intent text not null default 'maintain';

alter table public.contact_messages
  add column if not exists source text not null default 'direct',
  add column if not exists intent text not null default 'contact';

comment on column public.reservations.source is 'Canal de origen del lead';
comment on column public.reservations.intent is 'Intención: buy | install | maintain | advisory | general';
comment on column public.support_tickets.source is 'Canal de origen del ticket';
comment on column public.support_tickets.intent is 'Intención comercial/técnica';
comment on column public.contact_messages.source is 'Canal de origen del mensaje';
comment on column public.contact_messages.intent is 'Intención del contacto';

create or replace function public.create_support_ticket(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text default null,
  p_subject text default '',
  p_description text default '',
  p_related_reservation_id uuid default null,
  p_source text default 'direct',
  p_intent text default 'maintain'
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  row public.support_tickets;
begin
  insert into public.support_tickets (
    customer_name, customer_email, customer_phone, subject, description,
    related_reservation_id, source, intent
  ) values (
    nullif(btrim(p_customer_name), ''),
    nullif(btrim(p_customer_email), ''),
    nullif(btrim(coalesce(p_customer_phone, '')), ''),
    coalesce(nullif(btrim(p_subject), ''), 'Consulta técnica'),
    coalesce(nullif(btrim(p_description), ''), ''),
    p_related_reservation_id,
    coalesce(nullif(btrim(p_source), ''), 'direct'),
    coalesce(nullif(btrim(p_intent), ''), 'maintain')
  )
  returning * into row;
  return row;
end;
$$;

drop function if exists public.create_support_ticket(text, text, text, text, text, uuid);
revoke all on function public.create_support_ticket(text, text, text, text, text, uuid, text, text) from public;
grant execute on function public.create_support_ticket(text, text, text, text, text, uuid, text, text) to anon, authenticated;

create or replace function public.create_reservation(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_service_category text,
  p_preferred_date date,
  p_preferred_time_slot text,
  p_address text default '',
  p_notes text default null,
  p_source text default 'direct',
  p_intent text default 'install'
)
returns public.reservations
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  row public.reservations;
begin
  insert into public.reservations (
    customer_name, customer_email, customer_phone, service_category,
    preferred_date, preferred_time_slot, address, notes, source, intent
  ) values (
    nullif(btrim(p_customer_name), ''),
    nullif(btrim(p_customer_email), ''),
    nullif(btrim(p_customer_phone), ''),
    coalesce(nullif(btrim(p_service_category), ''), 'Consulta'),
    p_preferred_date,
    coalesce(nullif(btrim(p_preferred_time_slot), ''), 'morning'),
    coalesce(p_address, ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    coalesce(nullif(btrim(p_source), ''), 'direct'),
    coalesce(nullif(btrim(p_intent), ''), 'install')
  )
  returning * into row;
  return row;
end;
$$;

drop function if exists public.create_reservation(text, text, text, text, date, text, text, text);
revoke all on function public.create_reservation(text, text, text, text, date, text, text, text, text, text) from public;
grant execute on function public.create_reservation(text, text, text, text, date, text, text, text, text, text) to anon, authenticated;

create or replace function public.create_contact_message(
  p_name text,
  p_email text,
  p_phone text default null,
  p_subject public.contact_subject default 'general',
  p_message text default '',
  p_source text default 'direct',
  p_intent text default 'contact'
)
returns public.contact_messages
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  row public.contact_messages;
begin
  insert into public.contact_messages (
    name, email, phone, subject, message, source, intent
  ) values (
    nullif(btrim(p_name), ''),
    nullif(btrim(p_email), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    coalesce(p_subject, 'general'::public.contact_subject),
    coalesce(nullif(btrim(p_message), ''), ''),
    coalesce(nullif(btrim(p_source), ''), 'direct'),
    coalesce(nullif(btrim(p_intent), ''), 'contact')
  )
  returning * into row;
  return row;
end;
$$;

drop function if exists public.create_contact_message(text, text, text, public.contact_subject, text);
revoke all on function public.create_contact_message(text, text, text, public.contact_subject, text, text, text) from public;
grant execute on function public.create_contact_message(text, text, text, public.contact_subject, text, text, text) to anon, authenticated;
