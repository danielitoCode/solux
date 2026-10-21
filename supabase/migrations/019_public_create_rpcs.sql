-- SOLUX: creación pública de ticket / reserva / contacto sin depender de SELECT RLS.
-- El front usaba insert().select() y anon no tiene SELECT → error 42501 en producción.

-- ─── Support ticket ─────────────────────────────────────────
create or replace function public.create_support_ticket(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text default null,
  p_subject text default '',
  p_description text default '',
  p_related_reservation_id uuid default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.support_tickets;
begin
  insert into public.support_tickets (
    customer_name,
    customer_email,
    customer_phone,
    subject,
    description,
    related_reservation_id
  ) values (
    nullif(btrim(p_customer_name), ''),
    nullif(btrim(p_customer_email), ''),
    nullif(btrim(coalesce(p_customer_phone, '')), ''),
    coalesce(nullif(btrim(p_subject), ''), 'Consulta técnica'),
    coalesce(nullif(btrim(p_description), ''), ''),
    p_related_reservation_id
  )
  returning * into row;

  return row;
end;
$$;

revoke all on function public.create_support_ticket(text, text, text, text, text, uuid) from public;
grant execute on function public.create_support_ticket(text, text, text, text, text, uuid) to anon, authenticated;

-- ─── Reservation ────────────────────────────────────────────
create or replace function public.create_reservation(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_service_category text,
  p_preferred_date date,
  p_preferred_time_slot text,
  p_address text default '',
  p_notes text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.reservations;
begin
  insert into public.reservations (
    customer_name,
    customer_email,
    customer_phone,
    service_category,
    preferred_date,
    preferred_time_slot,
    address,
    notes
  ) values (
    nullif(btrim(p_customer_name), ''),
    nullif(btrim(p_customer_email), ''),
    nullif(btrim(p_customer_phone), ''),
    coalesce(nullif(btrim(p_service_category), ''), 'Consulta'),
    p_preferred_date,
    coalesce(nullif(btrim(p_preferred_time_slot), ''), 'morning'),
    coalesce(p_address, ''),
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning * into row;

  return row;
end;
$$;

revoke all on function public.create_reservation(text, text, text, text, date, text, text, text) from public;
grant execute on function public.create_reservation(text, text, text, text, date, text, text, text) to anon, authenticated;

-- ─── Contact message ────────────────────────────────────────
create or replace function public.create_contact_message(
  p_name text,
  p_email text,
  p_phone text default null,
  p_subject public.contact_subject default 'general',
  p_message text default ''
)
returns public.contact_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.contact_messages;
begin
  insert into public.contact_messages (
    name,
    email,
    phone,
    subject,
    message
  ) values (
    nullif(btrim(p_name), ''),
    nullif(btrim(p_email), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    coalesce(p_subject, 'general'::public.contact_subject),
    coalesce(nullif(btrim(p_message), ''), '')
  )
  returning * into row;

  return row;
end;
$$;

revoke all on function public.create_contact_message(text, text, text, public.contact_subject, text) from public;
grant execute on function public.create_contact_message(text, text, text, public.contact_subject, text) to anon, authenticated;
