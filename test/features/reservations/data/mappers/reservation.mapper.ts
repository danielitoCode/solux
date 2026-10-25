import { describe, it, expect } from 'vitest';
import { mapReservationDto } from '$features/reservations/data/mappers/reservation.mapper';
import type { ReservationDto } from '$features/reservations/data/dto/reservation.dto';

describe('reservation.mapper', () => {
  it('defaults source/intent', () => {
    const r = mapReservationDto({
      id: 'r1', tracking_code: 'SLX-1', customer_name: 'A', customer_email: 'a@t.com',
      customer_phone: '809', service_category: 'install', preferred_date: '2026-11-01',
      preferred_time_slot: 'morning', address: 'GTM', notes: null, status: 'pending',
      assigned_to: null, source: null, intent: '  ', created_at: '2026-01-01', updated_at: '2026-01-02'
    });
    expect(r.source).toBe('direct');
    expect(r.intent).toBe('install');
    expect(r.notes).toBeUndefined();
  });
  it('respeta source/intent', () => {
    const r = mapReservationDto({
      id: 'r1', tracking_code: 'SLX-1', customer_name: 'A', customer_email: 'a@t.com',
      customer_phone: '809', service_category: 'install', preferred_date: '2026-11-01',
      preferred_time_slot: 'morning', address: 'GTM', notes: 'n', status: 'confirmed',
      assigned_to: 'u1', source: 'catalog', intent: 'buy', created_at: '2026-01-01', updated_at: '2026-01-02'
    } as ReservationDto);
    expect(r.source).toBe('catalog');
    expect(r.intent).toBe('buy');
  });
});
