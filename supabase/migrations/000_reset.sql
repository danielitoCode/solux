-- SOLO desarrollo: borra schema público SOLUX para re-ejecutar migraciones limpias.
-- NO usar en producción con datos reales.

drop function if exists public.get_ticket_messages_by_tracking(text);
drop function if exists public.get_ticket_by_tracking(text);
drop function if exists public.get_reservation_by_tracking(text);
drop function if exists public.is_staff();
drop function if exists public.current_user_role();
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_ticket_tracking_code() cascade;
drop function if exists public.set_reservation_tracking_code() cascade;
drop function if exists public.generate_tracking_code();
drop function if exists public.set_updated_at() cascade;

drop table if exists public.ticket_messages cascade;
drop table if exists public.support_tickets cascade;
drop table if exists public.reservations cascade;
drop table if exists public.catalog_items cascade;
drop table if exists public.contact_messages cascade;
drop table if exists public.business_hours cascade;
drop table if exists public.contact_info cascade;
drop table if exists public.projects cascade;
drop table if exists public.services cascade;
drop table if exists public.company_profile cascade;
drop table if exists public.profiles cascade;

drop type if exists public.service_category;
drop type if exists public.day_of_week;
drop type if exists public.contact_subject;
drop type if exists public.message_author;
drop type if exists public.ticket_priority;
drop type if exists public.ticket_status;
drop type if exists public.reservation_status;
drop type if exists public.catalog_category;
drop type if exists public.catalog_item_type;
drop type if exists public.user_role;
