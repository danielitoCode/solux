import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConsumableProduct, ConsumableProductInput } from '$features/consumables/domain/entities/consumable-product';
import type { ConsumableRepository } from '$features/consumables/domain/repository/consumable-repository';
import {
  ListConsumables,
  CreateConsumable,
  UpdateConsumable,
  ToggleConsumable
} from '$features/consumables/domain/usecases/consumable-usecases';

const product = (o: Partial<ConsumableProduct> = {}): ConsumableProduct =>
  ({ id: 'c-1', name: 'MC4', isActive: true, ...o }) as ConsumableProduct;

describe('consumable-usecases', () => {
  let repo: ConsumableRepository;
  beforeEach(() => {
    repo = { list: vi.fn(), create: vi.fn(), update: vi.fn(), toggle: vi.fn() };
  });
  it('ListConsumables', async () => {
    vi.mocked(repo.list).mockResolvedValue([product()]);
    expect(await new ListConsumables(repo).execute()).toHaveLength(1);
  });
  it('CreateConsumable', async () => {
    const input = { name: 'Cable' } as ConsumableProductInput;
    vi.mocked(repo.create).mockResolvedValue(product({ name: 'Cable' }));
    await new CreateConsumable(repo).execute(input);
    expect(repo.create).toHaveBeenCalledWith(input);
  });
  it('UpdateConsumable', async () => {
    const input = { name: 'Cable 6mm' } as ConsumableProductInput;
    vi.mocked(repo.update).mockResolvedValue(product({ name: 'Cable 6mm' }));
    await new UpdateConsumable(repo).execute('c-1', input);
    expect(repo.update).toHaveBeenCalledWith('c-1', input);
  });
  it('ToggleConsumable invierte activo', async () => {
    vi.mocked(repo.toggle).mockResolvedValue(product({ isActive: false }));
    await new ToggleConsumable(repo).execute(product({ isActive: true }));
    expect(repo.toggle).toHaveBeenCalledWith('c-1', false);
  });
});
