-- SOLUX: las respuestas de tickets pertenecen exclusivamente a staff.
-- Cliente puede crear ticket y consultar respuestas públicas, pero no escribir en el hilo.

drop policy if exists "Anyone insert customer ticket_messages" on public.ticket_messages;
drop policy if exists "Staff manage ticket_messages" on public.ticket_messages;

revoke insert on public.ticket_messages from anon;

create policy "Staff read ticket_messages"
  on public.ticket_messages for select
  using (public.is_staff());

create policy "Staff insert ticket_messages"
  on public.ticket_messages for insert
  with check (
    public.is_staff()
    and author = 'agent'
  );

create policy "Staff update ticket_messages"
  on public.ticket_messages for update
  using (public.is_staff())
  with check (
    public.is_staff()
    and author = 'agent'
  );

create policy "Staff delete ticket_messages"
  on public.ticket_messages for delete
  using (public.is_staff());
