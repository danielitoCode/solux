-- Corrige get_financial_summary: asegura 10 columnas en el orden declarado.
drop function if exists public.get_financial_summary(timestamptz, timestamptz);

create function public.get_financial_summary(
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
  if public.current_user_role() <> 'admin' then
    raise exception 'forbidden';
  end if;

  return query
  with ops as (
    select fo.*
    from public.financial_operations fo
    where fo.status = 'posted'
      and fo.occurred_at >= coalesce(p_from, '-infinity'::timestamptz)
      and fo.occurred_at <= coalesce(p_to, 'infinity'::timestamptz)
  ),
  charges as (
    select
      c.id,
      c.amount,
      c.metadata->>'fulfillment_model' as fulfillment_model,
      coalesce((
        select sum(p.amount)
        from public.financial_operations p
        where p.related_operation_id = c.id
          and p.operation_type = 'customer_payment'
          and p.status = 'posted'
      ), 0)::numeric as paid
    from ops c
    where c.operation_type = 'customer_charge'
  )
  select
    coalesce((select sum(c.amount) from charges c where c.fulfillment_model is distinct from 'managed_sale'), 0)::numeric,
    coalesce((select sum(o.amount) from ops o where o.operation_type = 'managed_sale_commission'), 0)::numeric,
    coalesce((select sum(o.amount) from ops o where o.operation_type = 'customer_payment'), 0)::numeric,
    coalesce((select sum(o.amount) from ops o where o.operation_type = 'customer_refund'), 0)::numeric,
    coalesce((select sum(o.amount) from ops o where o.operation_type = 'operating_expense'), 0)::numeric,
    coalesce((select sum(o.amount) from ops o where o.operation_type = 'purchase'), 0)::numeric,
    coalesce((select sum(o.amount) from ops o where o.operation_type = 'labor_accrual'), 0)::numeric,
    coalesce((select sum(o.amount) from ops o where o.operation_type = 'employee_payment'), 0)::numeric,
    coalesce((
      select sum(case
        when o.operation_type in ('customer_payment', 'capital_contribution') then o.amount
        when o.operation_type in ('customer_refund', 'operating_expense', 'employee_payment', 'owner_withdrawal') then -o.amount
        else 0
      end)
      from ops o
    ), 0)::numeric,
    coalesce((select sum(greatest(c.amount - c.paid, 0)) from charges c), 0)::numeric;
end;
$$;

revoke all on function public.get_financial_summary(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_financial_summary(timestamptz, timestamptz) to authenticated;
