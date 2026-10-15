-- SOLUX Fase 5: cobros de clientes y reportes financieros consistentes.
-- Los cargos de venta no representan caja hasta registrar un cobro.

create or replace function public.record_customer_payment(
  p_operation_key text,
  p_charge_operation_id uuid,
  p_amount numeric,
  p_description text default 'Cobro de cliente',
  p_document_reference text default null,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
  v_charge public.financial_operations%rowtype;
  v_paid numeric(14,2);
  v_payment_id uuid;
begin
  if public.current_user_role() not in ('admin','sales') then raise exception 'forbidden'; end if;
  if coalesce(trim(p_operation_key),'') = '' or p_charge_operation_id is null
     or p_amount is null or p_amount <= 0 then
    raise exception 'invalid_customer_payment_parameters';
  end if;

  select id into v_existing from public.financial_operations where operation_key = p_operation_key;
  if v_existing is not null then return v_existing; end if;

  select * into v_charge from public.financial_operations
  where id = p_charge_operation_id and operation_type = 'customer_charge' and status = 'posted'
  for update;
  if not found then raise exception 'customer_charge_not_found'; end if;

  select coalesce(sum(amount),0) into v_paid
  from public.financial_operations
  where related_operation_id = v_charge.id
    and operation_type = 'customer_payment' and status = 'posted';

  if p_amount > v_charge.amount - v_paid then
    raise exception 'payment_exceeds_outstanding_charge';
  end if;

  insert into public.financial_operations (
    operation_key, operation_type, status, amount, currency, occurred_at,
    reservation_id, catalog_item_id, category, description, document_reference,
    related_operation_id, created_by
  ) values (
    p_operation_key, 'customer_payment', 'posted', round(p_amount,2), v_charge.currency,
    coalesce(p_occurred_at,now()), v_charge.reservation_id, v_charge.catalog_item_id,
    'customer_payment', coalesce(nullif(trim(p_description),''),'Cobro de cliente'),
    nullif(trim(p_document_reference),''), v_charge.id, auth.uid()
  ) returning id into v_payment_id;

  return v_payment_id;
end;
$$;

create or replace function public.get_financial_summary(
  p_from timestamptz default date_trunc('month', now()),
  p_to timestamptz default now()
)
returns table (
  sales_gross numeric,
  managed_sales_commission numeric,
  customer_cash_in numeric,
  customer_refunds numeric,
  operating_expenses numeric,
  inventory_purchases numeric,
  labor_accrued numeric,
  employee_cash_out numeric,
  estimated_cash_flow numeric,
  unpaid_customer_charges numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'admin' then raise exception 'forbidden'; end if;
  return query
  with ops as (
    select * from public.financial_operations
    where status = 'posted' and occurred_at >= coalesce(p_from,'-infinity'::timestamptz)
      and occurred_at <= coalesce(p_to,'infinity'::timestamptz)
  ),
  charges as (
    select c.id, c.amount, c.metadata->>'fulfillment_model' as fulfillment_model,
      coalesce((select sum(p.amount) from public.financial_operations p
        where p.related_operation_id = c.id and p.operation_type = 'customer_payment' and p.status = 'posted'),0) as paid
    from ops c where c.operation_type = 'customer_charge'
  )
  select
    coalesce((select sum(case when fulfillment_model = 'managed_sale' then 0 else amount end) from charges),0),
    coalesce((select sum(amount) from ops where operation_type = 'managed_sale_commission'),0),
    coalesce((select sum(amount) from ops where operation_type = 'customer_payment'),0),
    coalesce((select sum(amount) from ops where operation_type = 'customer_refund'),0),
    coalesce((select sum(amount) from ops where operation_type = 'operating_expense'),0),
    coalesce((select sum(amount) from ops where operation_type = 'purchase'),0),
    coalesce((select sum(amount) from ops where operation_type = 'labor_accrual'),0),
    coalesce((select sum(amount) from ops where operation_type = 'employee_payment'),0),
    coalesce((select sum(amount) from ops where operation_type in ('customer_payment','capital_contribution'))
      - sum(amount) filter (where operation_type in ('customer_refund','operating_expense','employee_payment','owner_withdrawal')),0)
      from ops,
    coalesce((select sum(greatest(amount-paid,0)) from charges),0);
end;
$$;

revoke all on function public.record_customer_payment(text,uuid,numeric,text,text,timestamptz) from public, anon;
revoke all on function public.get_financial_summary(timestamptz,timestamptz) from public, anon;
grant execute on function public.record_customer_payment(text,uuid,numeric,text,text,timestamptz) to authenticated;
grant execute on function public.get_financial_summary(timestamptz,timestamptz) to authenticated;
