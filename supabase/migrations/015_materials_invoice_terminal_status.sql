-- SOLUX Fase 7: consumibles agrupados, factura imprimible y estados terminales.
-- La RPC bloquea la reserva para evitar duplicados al agregar el mismo consumible concurrentemente.

create or replace function public.add_reservation_material(
  p_reservation_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_adjustment_type text default 'none',
  p_adjustment_percent numeric default 0,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
  v_product public.consumable_products%rowtype;
  v_id uuid;
  v_qty numeric(12,3);
  v_cost_total numeric;
  v_factor_total numeric;
  v_factor numeric;
  v_cost numeric(12,2);
  v_adjustment_type text;
  v_adjustment_percent numeric(7,2);
  v_notes text;
begin
  if public.current_user_role() not in ('admin','sales') then raise exception 'forbidden'; end if;
  if p_reservation_id is null or p_product_id is null or p_quantity is null or p_quantity <= 0
     or p_unit_cost is null or p_unit_cost < 0
     or p_adjustment_type not in ('markup','discount','none')
     or coalesce(p_adjustment_percent,0) < 0 or coalesce(p_adjustment_percent,0) > 1000 then
    raise exception 'invalid_reservation_material_parameters';
  end if;

  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'reservation_not_found'; end if;
  if v_reservation.status <> 'in_progress' then raise exception 'reservation_must_be_in_progress'; end if;

  select * into v_product from public.consumable_products where id = p_product_id and is_active = true;
  if not found then raise exception 'consumable_product_not_active'; end if;

  v_factor := case p_adjustment_type
    when 'markup' then 1 + coalesce(p_adjustment_percent,0) / 100
    when 'discount' then 1 - coalesce(p_adjustment_percent,0) / 100
    else 1
  end;

  select
    coalesce(sum(quantity),0) + p_quantity,
    coalesce(sum(quantity * unit_cost),0) + p_quantity * p_unit_cost,
    coalesce(sum(quantity * (
      case adjustment_type
        when 'markup' then 1 + adjustment_percent / 100
        when 'discount' then 1 - adjustment_percent / 100
        else 1
      end
    )),0) + p_quantity * v_factor,
    string_agg(distinct nullif(trim(notes),''), E'\n')
  into v_qty, v_cost_total, v_factor_total, v_notes
  from public.reservation_materials
  where reservation_id = p_reservation_id and product_id = p_product_id;

  v_qty := round(v_qty,3);
  v_cost := round(v_cost_total / v_qty,2);
  v_factor := v_factor_total / v_qty;
  if v_factor > 1 then
    v_adjustment_type := 'markup';
    v_adjustment_percent := round((v_factor - 1) * 100,2);
  elsif v_factor < 1 then
    v_adjustment_type := 'discount';
    v_adjustment_percent := round((1 - v_factor) * 100,2);
  else
    v_adjustment_type := 'none';
    v_adjustment_percent := 0;
  end if;

  select id into v_id from public.reservation_materials
    where reservation_id = p_reservation_id and product_id = p_product_id
    order by created_at, id limit 1 for update;

  if v_id is null then
    insert into public.reservation_materials (
      reservation_id, product_id, product_name, unit, quantity, unit_cost,
      adjustment_type, adjustment_percent, notes
    ) values (
      p_reservation_id, p_product_id, v_product.name, v_product.unit, v_qty, v_cost,
      v_adjustment_type, v_adjustment_percent,
      concat_ws(E'\n', nullif(v_notes,''), nullif(trim(p_notes),''))
    ) returning id into v_id;
  else
    update public.reservation_materials set
      product_name = v_product.name,
      unit = v_product.unit,
      quantity = v_qty,
      unit_cost = v_cost,
      adjustment_type = v_adjustment_type,
      adjustment_percent = v_adjustment_percent,
      notes = concat_ws(E'\n', nullif(v_notes,''), nullif(trim(p_notes),'')),
      updated_at = now()
    where reservation_id = p_reservation_id and product_id = p_product_id;

    -- Conserva una única línea por producto, consolidando filas históricas duplicadas.
    delete from public.reservation_materials
    where reservation_id = p_reservation_id and product_id = p_product_id and id <> v_id;
  end if;
  return v_id;
end;
$$;

revoke all on function public.add_reservation_material(uuid,uuid,numeric,numeric,text,numeric,text) from public, anon;
grant execute on function public.add_reservation_material(uuid,uuid,numeric,numeric,text,numeric,text) to authenticated;

create or replace function public.guard_reservation_terminal_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status in ('completed','cancelled') and new.status is distinct from old.status then
    raise exception 'terminal_reservation_status_immutable';
  end if;
  if new.status = 'completed' and old.status is distinct from 'completed'
     and not exists (select 1 from public.job_closeouts where reservation_id = old.id) then
    raise exception 'reservation_completion_requires_job_closeout';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_terminal_status_guard on public.reservations;
create trigger reservations_terminal_status_guard
before update of status on public.reservations
for each row execute function public.guard_reservation_terminal_status();
