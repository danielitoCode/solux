import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Reservation } from '$features/reservations/domain/entities';
import type { ReservationRepository } from '$features/reservations/domain/repository/reservation-repository';
import {
  CreateReservation,
  GetReservationByTrackingCode,
  ListReservations,
  UpdateReservationStatus
} from '$features/reservations/domain/usecases/reservation-usecases';

const sampleReservation = (overrides: Partial<Reservation> = {}): Reservation =>
  ({
    id: 'res-1',
    trackingCode: 'SLX-ABC12345',
    customerName: 'Ana',
    customerEmail: 'ana@test.com',
    customerPhone: '8090000000',
    serviceCategory: 'install',
    preferredDate: '2026-11-01',
    preferredTimeSlot: 'morning',
    address: 'Santo Domingo',
    status: 'pending',
    notes: '',
    source: 'catalog',
    intent: 'install',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides
  }) as Reservation;

describe('reservation-usecases', () => {
  let repo: ReservationRepository;

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      getByTrackingCode: vi.fn(),
      listAll: vi.fn(),
      updateStatus: vi.fn()
    };
  });

  it('CreateReservation envía input al repository', async () => {
    const input = {
      customerName: 'Ana',
      customerEmail: 'ana@test.com',
      customerPhone: '8090000000',
      serviceCategory: 'install',
      preferredDate: '2026-11-01',
      preferredTimeSlot: 'morning',
      address: 'Santo Domingo',
      source: 'catalog',
      intent: 'install'
    };
    const created = sampleReservation();
    vi.mocked(repo.create).mockResolvedValue(created);

    const result = await new CreateReservation(repo).execute(input);

    expect(repo.create).toHaveBeenCalledWith(input);
    expect(result.trackingCode).toMatch(/^SLX-/);
  });

  it('GetReservationByTrackingCode busca por código', async () => {
    const row = sampleReservation();
    vi.mocked(repo.getByTrackingCode).mockResolvedValue(row);

    const result = await new GetReservationByTrackingCode(repo).execute('SLX-ABC12345');

    expect(repo.getByTrackingCode).toHaveBeenCalledWith('SLX-ABC12345');
    expect(result?.id).toBe('res-1');
  });

  it('GetReservationByTrackingCode devuelve null si no existe', async () => {
    vi.mocked(repo.getByTrackingCode).mockResolvedValue(null);

    const result = await new GetReservationByTrackingCode(repo).execute('SLX-NOPE');

    expect(result).toBeNull();
  });

  it('ListReservations lista todas', async () => {
    vi.mocked(repo.listAll).mockResolvedValue([sampleReservation()]);

    const result = await new ListReservations(repo).execute();

    expect(result).toHaveLength(1);
  });

  it('UpdateReservationStatus cambia estado', async () => {
    const updated = sampleReservation({ status: 'confirmed' });
    vi.mocked(repo.updateStatus).mockResolvedValue(updated);

    const result = await new UpdateReservationStatus(repo).execute('res-1', 'confirmed');

    expect(repo.updateStatus).toHaveBeenCalledWith('res-1', 'confirmed');
    expect(result.status).toBe('confirmed');
  });
});
