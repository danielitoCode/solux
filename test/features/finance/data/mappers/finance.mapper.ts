import { describe, it, expect } from 'vitest';
import {
  mapEmployee,
  mapReservation,
  mapOperation,
  mapCharge,
  mapPayment,
  mapSummary
} from '$features/finance/data/mappers/finance.mapper';

describe('finance.mapper', () => {
  it('mapEmployee', () => {
    const e = mapEmployee({
      id: 'e1',
      full_name: 'Pedro',
      role_title: 'Técnico',
      email: null,
      phone: null,
      is_active: true,
      notes: ''
    });
    expect(e.fullName).toBe('Pedro');
    expect(e.roleTitle).toBe('Técnico');
    expect(e.isActive).toBe(true);
  });

  it('mapReservation (finance slice)', () => {
    const r = mapReservation({
      id: 'r1',
      tracking_code: 'SLX-1',
      customer_name: 'Ana',
      service_category: 'install',
      preferred_date: '2026-11-01',
      status: 'pending'
    });
    expect(r.trackingCode).toBe('SLX-1');
    expect(r.customerName).toBe('Ana');
  });

  it('mapOperation coerce amount', () => {
    const o = mapOperation({
      id: 'o1',
      operation_type: 'expense',
      amount: '25.5' as unknown as number,
      currency: 'USD',
      occurred_at: '2026-01-01',
      category: 'ops',
      description: 'x',
      status: 'posted',
      employee_id: null,
      reservation_id: null
    });
    expect(o.amount).toBe(25.5);
    expect(o.operationType).toBe('expense');
  });

  it('mapCharge y mapPayment', () => {
    const c = mapCharge({
      id: 'c1',
      amount: 100,
      currency: 'USD',
      occurred_at: '2026-01-01',
      description: 'cargo',
      reservation_id: 'r1'
    });
    expect(c.amount).toBe(100);
    expect(c.reservationId).toBe('r1');

    const p = mapPayment({ related_operation_id: 'o1', amount: 50 });
    expect(p.relatedOperationId).toBe('o1');
    expect(p.amount).toBe(50);
  });

  it('mapSummary null y valores numéricos', () => {
    expect(mapSummary(null)).toBeNull();
    const s = mapSummary({
      sales_gross: 1000,
      managed_sales_commission: 50,
      customer_cash_in: 800,
      customer_refunds: 0,
      operating_expenses: 100,
      inventory_purchases: 200,
      labor_accrued: 80,
      employee_cash_out: 40,
      estimated_cash_flow: 430,
      unpaid_customer_charges: 20
    });
    expect(s?.salesGross).toBe(1000);
    expect(s?.estimatedCashFlow).toBe(430);
  });
});
