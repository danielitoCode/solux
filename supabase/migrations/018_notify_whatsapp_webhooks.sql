-- SOLUX: notificaciones WhatsApp vía Edge Function notify-whatsapp (CallMeBot)
-- Disparo automático en INSERT de reservations, support_tickets, contact_messages.
--
-- Requiere extensión pg_net.
-- URL y secreto NO van hardcodeados: se leen de public.notification_settings.
-- Tras aplicar la migración, configura una sola fila (ver final del archivo).

create extension if not exists pg_net with schema extensions;

-- Configuración (1 fila). Evita secretos en el SQL versionado.
create table if not exists public.notification_settings (
  id smallint primary key default 1 check (id = 1),
  whatsapp_function_url text,
  whatsapp_notify_secret text,
  updated_at timestamptz not null default now()
);

comment on table public.notification_settings is
  'URL de la Edge Function notify-whatsapp y secreto x-notify-secret. Solo staff.';

alter table public.notification_settings enable row level security;

drop policy if exists "Staff read notification_settings" on public.notification_settings;
drop policy if exists "Staff write notification_settings" on public.notification_settings;

create policy "Staff read notification_settings"
  on public.notification_settings for select
  using (public.is_staff());

create policy "Staff write notification_settings"
  on public.notification_settings for all
  using (public.is_staff())
  with check (public.is_staff());

-- Función disparada por triggers
create or replace function public.notify_whatsapp_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  req_id bigint;
  payload jsonb;
  fn_url text;
  fn_secret text;
  headers jsonb;
begin
  select s.whatsapp_function_url, s.whatsapp_notify_secret
    into fn_url, fn_secret
  from public.notification_settings s
  where s.id = 1;

  -- Sin URL configurada: no falla el INSERT del formulario
  if fn_url is null or btrim(fn_url) = '' then
    return NEW;
  end if;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW)
  );

  headers := jsonb_build_object('Content-Type', 'application/json');
  if fn_secret is not null and btrim(fn_secret) <> '' then
    headers := headers || jsonb_build_object('x-notify-secret', fn_secret);
  end if;

  select net.http_post(
    url := fn_url,
    headers := headers,
    body := payload
  ) into req_id;

  return NEW;
exception
  when others then
    -- No bloquear el alta del cliente si falla la notificación
    raise warning 'notify_whatsapp_webhook: %', SQLERRM;
    return NEW;
end;
$$;

comment on function public.notify_whatsapp_webhook() is
  'AFTER INSERT: POST a Edge Function notify-whatsapp (CallMeBot).';

drop trigger if exists trg_notify_reservations on public.reservations;
create trigger trg_notify_reservations
  after insert on public.reservations
  for each row
  execute function public.notify_whatsapp_webhook();

drop trigger if exists trg_notify_tickets on public.support_tickets;
create trigger trg_notify_tickets
  after insert on public.support_tickets
  for each row
  execute function public.notify_whatsapp_webhook();

drop trigger if exists trg_notify_contact on public.contact_messages;
create trigger trg_notify_contact
  after insert on public.contact_messages
  for each row
  execute function public.notify_whatsapp_webhook();

-- ---------------------------------------------------------------------------
-- Configuración (ejecutar una vez en SQL Editor, con tus valores reales):
--
-- insert into public.notification_settings (id, whatsapp_function_url, whatsapp_notify_secret)
-- values (
--   1,
--   'https://TU_PROJECT_REF.supabase.co/functions/v1/notify-whatsapp',
--   'TU_NOTIFY_WEBHOOK_SECRET'
-- )
-- on conflict (id) do update set
--   whatsapp_function_url = excluded.whatsapp_function_url,
--   whatsapp_notify_secret = excluded.whatsapp_notify_secret,
--   updated_at = now();
-- ---------------------------------------------------------------------------
