-- SOLUX Fase 2: catálogo público seguro y operaciones atómicas de inventario/venta.
-- Las columnas internas de abastecimiento nunca se exponen en la vista pública.

create or replace view public.public_catalog
with (security_barrier = true)
as
select
  id, type, category, name, short_description, description, price, currency,
  image_url, features, is_featured, sort_order
from public.catalog_items
where is_active = true
  and type = 'product'
  and (
    (fulfillment_model = 'owned_stock' and stock_quantity > 0)
    or (fulfillment_model = 'managed_sale' and external_availability = 'available')
  );

grant select on public.public_catalog to anon, authenticated;

-- Operación de compra: registra gasto, entrada de inventario y costo promedio ponderado
-- dentro de una sola transacción. operation_key hace la solicitud idempotente.
create or replace function public.receive_catalog_purchase(
  p_operation_key text,
  p_catalog_item_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_description text default 'Compra de inventario',
  p_document_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.catalog_items%rowtype;
  v_operation_id uuid;
  v_existing_id uuid;
  v_total_qty numeric;
  v_total_cost numeric;
begin
  if public.current_user_role() not in ('admin','sales') then
    raise exception 'forbidden';
  end if;
  if p_operation_key is null or length(trim(p_operation_key)) = 0
     or p_quantity is null or p_quantity <= 0
     or p_unit_cost is null or p_unit_cost < 0 then
    raise exception 'invalid_purchase_parameters';
  end if;

  select id into v_existing_id from public.financial_operations where operation_key = p_operation_key;
  if v_existing_id is not null then return v_existing_id; end if;

  select * into v_item from public.catalog_items
  where id = p_catalog_item_id for update;
  if not found then raise exception 'catalog_item_not_found'; end if;
  if v_item.fulfillment_model <> 'owned_stock' then
    raise exception 'managed_sale_has_no_owned_inventory';
  end if;

  insert into public.financial_operations (
    operation_key, operation_type, status, amount, currency, category,
    catalog_item_id, description, document_reference, created_by
  ) values (
    p_operation_key, 'purchase', 'posted', round(p_quantity * p_unit_cost, 2),
    v_item.currency, 'inventory_purchase', v_item.id,
    p_description, p_document_reference, auth.uid()
  ) returning id into v_operation_id;

  v_total_qty := v_item.stock_quantity + p_quantity;
  v_total_cost := (v_item.stock_quantity * v_item.average_cost) + (p_quantity * p_unit_cost);

  update public.catalog_items
  set stock_quantity = v_total_qty,
      acquisition_cost = p_unit_cost,
      average_cost = case when v_total_qty = 0 then 0 else round(v_total_cost / v_total_qty, 2) end
  where id = v_item.id;

  insert into public.inventory_movements (
    operation_key, item_kind, catalog_item_id, movement_type, quantity,
    unit_cost, financial_operation_id, reason, created_by
  ) values (
    p_operation_key, 'catalog_product', v_item.id, 'purchase_receipt',
    p_quantity, p_unit_cost, v_operation_id, p_description, auth.uid()
  );

  return v_operation_id;
end;
$$;

-- Venta: registra cargo bruto. Para venta gestionada, registra aparte comisión
-- y saldo pagadero al proveedor; no toca stock propio.
alter table public.financial_operations
  drop constraint if exists financial_operations_operation_type_check;
alter table public.financial_operations
  add constraint financial_operations_operation_type_check check (operation_type in (
    'customer_charge','customer_payment','customer_refund',
    'purchase','operating_expense','labor_accrual','employee_payment',
    'investment_reserve','cooperative_distribution','capital_contribution',
    'owner_withdrawal','internal_transfer','inventory_adjustment','reversal',
    'managed_sale_commission','supplier_payable','other'
  ));

create or replace function public.record_catalog_sale(
  p_operation_key text,
  p_catalog_item_id uuid,
  p_quantity numeric,
  p_sale_unit_price numeric,
  p_description text default 'Venta de producto'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.catalog_items%rowtype;
  v_charge_id uuid;
  v_existing_id uuid;
  v_gross numeric(14,2);
  v_commission numeric(14,2);
  v_supplier_amount numeric(14,2);
begin
  if public.current_user_role() not in ('admin','sales') then
    raise exception 'forbidden';
  end if;
  if p_operation_key is null or length(trim(p_operation_key)) = 0
     or p_quantity is null or p_quantity <= 0
     or p_sale_unit_price is null or p_sale_unit_price < 0 then
    raise exception 'invalid_sale_parameters';
  end if;

  select id into v_existing_id from public.financial_operations where operation_key = p_operation_key;
  if v_existing_id is not null then return v_existing_id; end if;

  select * into v_item from public.catalog_items
  where id = p_catalog_item_id for update;
  if not found or not v_item.is_active or v_item.type <> 'product' then
    raise exception 'catalog_item_unavailable';
  end if;

  if v_item.fulfillment_model = 'owned_stock' and v_item.stock_quantity < p_quantity then
    raise exception 'insufficient_stock';
  end if;
  if v_item.fulfillment_model = 'managed_sale' and v_item.external_availability <> 'available' then
    raise exception 'supplier_item_unavailable';
  end if;

  v_gross := round(p_quantity * p_sale_unit_price, 2);

  insert into public.financial_operations (
    operation_key, operation_type, status, amount, currency, category,
    catalog_item_id, description, created_by, metadata
  ) values (
    p_operation_key, 'customer_charge', 'posted', v_gross, v_item.currency,
    'product_sale', v_item.id, p_description, auth.uid(),
    jsonb_build_object('quantity', p_quantity, 'unit_price', p_sale_unit_price,
      'fulfillment_model', v_item.fulfillment_model)
  ) returning id into v_charge_id;

  if v_item.fulfillment_model = 'owned_stock' then
    update public.catalog_items
    set stock_quantity = stock_quantity - p_quantity
    where id = v_item.id;

    insert into public.inventory_movements (
      operation_key, item_kind, catalog_item_id, movement_type, quantity,
      unit_cost, financial_operation_id, reason, created_by
    ) values (
      p_operation_key || ':stock', 'catalog_product', v_item.id, 'sale',
      p_quantity, v_item.average_cost, v_charge_id, p_description, auth.uid()
    );
  else
    v_commission := round(v_gross * v_item.commission_percent / 100, 2);
    v_supplier_amount := v_gross - v_commission;

    insert into public.financial_operations (
      operation_key, operation_type, status, amount, currency, category,
      catalog_item_id, description, related_operation_id, created_by, metadata
    ) values (
      p_operation_key || ':commission', 'managed_sale_commission', 'posted',
      v_commission, v_item.currency, 'sales_commission', v_item.id,
      'Comisión por venta gestionada: ' || v_item.name, v_charge_id, auth.uid(),
      jsonb_build_object('commission_percent', v_item.commission_percent)
    );

    insert into public.financial_operations (
      operation_key, operation_type, status, amount, currency, category,
      catalog_item_id, description, related_operation_id, created_by
    ) values (
      p_operation_key || ':supplier', 'supplier_payable', 'posted',
      v_supplier_amount, v_item.currency, 'supplier_payable', v_item.id,
      'Importe pendiente de proveedor por venta gestionada: ' || v_item.name,
      v_charge_id, auth.uid()
    );
  end if;

  return v_charge_id;
end;
$$;

revoke all on function public.receive_catalog_purchase(text, uuid, numeric, numeric, text, text) from public, anon;
revoke all on function public.record_catalog_sale(text, uuid, numeric, numeric, text) from public, anon;
grant execute on function public.receive_catalog_purchase(text, uuid, numeric, numeric, text, text) to authenticated;
grant execute on function public.record_catalog_sale(text, uuid, numeric, numeric, text) to authenticated;
