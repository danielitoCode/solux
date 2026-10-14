-- SOLUX — Row Level Security
-- Público: lectura de presentación/catálogo + insert reservas/mensajes/tickets + lookup por tracking_code
-- Staff: CRUD según rol

alter table public.profiles enable row level security;
alter table public.company_profile enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.contact_info enable row level security;
alter table public.business_hours enable row level security;
alter table public.contact_messages enable row level security;
alter table public.catalog_items enable row level security;
alter table public.reservations enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- ---- profiles ----
create policy "Staff read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.current_user_role() = 'admin');

create policy "Admin manage profiles"
  on public.profiles for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---- company_profile / services / projects (público lee, admin escribe) ----
create policy "Public read company_profile"
  on public.company_profile for select using (true);
create policy "Admin write company_profile"
  on public.company_profile for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Public read services"
  on public.services for select using (is_active = true or public.is_staff());
create policy "Admin write services"
  on public.services for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Public read projects"
  on public.projects for select using (true);
create policy "Admin write projects"
  on public.projects for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---- contact_info / business_hours ----
create policy "Public read contact_info"
  on public.contact_info for select using (true);
create policy "Admin write contact_info"
  on public.contact_info for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Public read business_hours"
  on public.business_hours for select using (true);
create policy "Admin write business_hours"
  on public.business_hours for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---- contact_messages ----
-- Cualquiera puede enviar mensaje (anon insert)
create policy "Anyone insert contact_messages"
  on public.contact_messages for insert
  with check (true);

create policy "Staff read contact_messages"
  on public.contact_messages for select
  using (public.is_staff());

create policy "Staff update contact_messages"
  on public.contact_messages for update
  using (
    public.current_user_role() in ('admin', 'support', 'sales')
  );

create policy "Admin delete contact_messages"
  on public.contact_messages for delete
  using (public.current_user_role() = 'admin');

-- ---- catalog_items ----
create policy "Public read active catalog"
  on public.catalog_items for select
  using (is_active = true or public.is_staff());

create policy "Sales and admin write catalog"
  on public.catalog_items for all
  using (public.current_user_role() in ('admin', 'sales'))
  with check (public.current_user_role() in ('admin', 'sales'));

-- ---- reservations ----
-- Público puede crear reserva
create policy "Anyone insert reservations"
  on public.reservations for insert
  with check (true);

-- Público puede leer SU reserva solo por tracking_code (vía RPC, ver abajo)
-- Staff lee todo
create policy "Staff read reservations"
  on public.reservations for select
  using (public.is_staff());

create policy "Sales and admin update reservations"
  on public.reservations for update
  using (public.current_user_role() in ('admin', 'sales'))
  with check (public.current_user_role() in ('admin', 'sales'));

create policy "Admin delete reservations"
  on public.reservations for delete
  using (public.current_user_role() = 'admin');

-- ---- support_tickets ----
create policy "Anyone insert support_tickets"
  on public.support_tickets for insert
  with check (true);

create policy "Staff read support_tickets"
  on public.support_tickets for select
  using (public.is_staff());

create policy "Support and admin update tickets"
  on public.support_tickets for update
  using (public.current_user_role() in ('admin', 'support'))
  with check (public.current_user_role() in ('admin', 'support'));

create policy "Admin delete tickets"
  on public.support_tickets for delete
  using (public.current_user_role() = 'admin');

-- ---- ticket_messages ----
-- Cliente puede insertar mensaje no-interno (vía RPC o política abierta controlada)
create policy "Anyone insert customer ticket_messages"
  on public.ticket_messages for insert
  with check (author = 'customer' and is_internal = false);

create policy "Staff manage ticket_messages"
  on public.ticket_messages for all
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================
-- RPCs públicas para tracking (sin auth)
-- ============================================================
create or replace function public.get_reservation_by_tracking(p_code text)
returns setof public.reservations
language sql
security definer
set search_path = public
as $$
  select * from public.reservations
  where tracking_code = upper(trim(p_code))
  limit 1;
$$;

grant execute on function public.get_reservation_by_tracking(text) to anon, authenticated;

create or replace function public.get_ticket_by_tracking(p_code text)
returns setof public.support_tickets
language sql
security definer
set search_path = public
as $$
  select * from public.support_tickets
  where tracking_code = upper(trim(p_code))
  limit 1;
$$;

grant execute on function public.get_ticket_by_tracking(text) to anon, authenticated;

create or replace function public.get_ticket_messages_by_tracking(p_code text)
returns setof public.ticket_messages
language sql
security definer
set search_path = public
as $$
  select tm.*
  from public.ticket_messages tm
  join public.support_tickets st on st.id = tm.ticket_id
  where st.tracking_code = upper(trim(p_code))
    and tm.is_internal = false
  order by tm.created_at asc;
$$;

grant execute on function public.get_ticket_messages_by_tracking(text) to anon, authenticated;
