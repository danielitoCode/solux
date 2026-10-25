import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReservationWorkRepository } from '$features/reservations/domain/repository/reservation-work-repository';
import {
  GetReservationMaterialsData, AddReservationMaterial, RemoveReservationMaterial,
  GetReservationCloseoutData, CloseReservationJob, CancelReservationJob
} from '$features/reservations/domain/usecases/reservation-work-usecases';

describe('reservation-work-usecases', () => {
  let repo: ReservationWorkRepository;
  beforeEach(() => {
    repo = {
      getMaterialsProducts: vi.fn(), getReservationMaterials: vi.fn(),
      getReservationTrackingCode: vi.fn(), addMaterial: vi.fn(), removeMaterial: vi.fn(),
      getCloseoutData: vi.fn(), closeJob: vi.fn(), cancelJob: vi.fn()
    };
  });
  it('GetReservationMaterialsData paraleliza', async () => {
    vi.mocked(repo.getMaterialsProducts).mockResolvedValue([{}]);
    vi.mocked(repo.getReservationMaterials).mockResolvedValue([{}]);
    vi.mocked(repo.getReservationTrackingCode).mockResolvedValue('SLX-1');
    const [p, m, c] = await new GetReservationMaterialsData(repo).execute('res-1');
    expect(p).toHaveLength(1); expect(m).toHaveLength(1); expect(c).toBe('SLX-1');
  });
  it('AddReservationMaterial', async () => {
    const input = { reservationId: 'res-1', productId: 'p1', quantity: 1, unitCost: 10, adjustmentType: 'none', adjustmentPercent: 0, notes: '' };
    vi.mocked(repo.addMaterial).mockResolvedValue(undefined);
    await new AddReservationMaterial(repo).execute(input);
    expect(repo.addMaterial).toHaveBeenCalledWith(input);
  });
  it('RemoveReservationMaterial', async () => {
    vi.mocked(repo.removeMaterial).mockResolvedValue(undefined);
    await new RemoveReservationMaterial(repo).execute('m1');
    expect(repo.removeMaterial).toHaveBeenCalledWith('m1');
  });
  it('GetReservationCloseoutData', async () => {
    vi.mocked(repo.getCloseoutData).mockResolvedValue({ materials: [], labor: [], closeout: null });
    expect((await new GetReservationCloseoutData(repo).execute('res-1')).closeout).toBeNull();
  });
  it('CloseReservationJob', async () => {
    const input = { reservationId: 'res-1', laborCharge: 1, otherCharge: 0, notes: '', operationKey: 'k' };
    vi.mocked(repo.closeJob).mockResolvedValue(undefined);
    await new CloseReservationJob(repo).execute(input);
    expect(repo.closeJob).toHaveBeenCalledWith(input);
  });
  it('CancelReservationJob', async () => {
    const input = { reservationId: 'res-1', customerCharge: 0, reason: 'x', notes: '', operationKey: 'k' };
    vi.mocked(repo.cancelJob).mockResolvedValue('liq-1');
    expect(await new CancelReservationJob(repo).execute(input)).toBe('liq-1');
  });
});
