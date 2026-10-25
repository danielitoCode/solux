import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CatalogItem } from '$features/catalog/domain/entities';
import type { CatalogRepository } from '$features/catalog/domain/repository/catalog-repository';
import {
  ListActiveCatalogItems,
  ListCatalogItems,
  CreateCatalogItem,
  UpdateCatalogItem,
  RemoveCatalogItem
} from '$features/catalog/domain/usecases/catalog-usecases';

const sampleItem = (overrides: Partial<CatalogItem> = {}): CatalogItem => ({
  id: 'cat-1',
  type: 'product',
  category: 'solar_panels',
  name: 'Panel 550W',
  shortDescription: 'Panel monocristalino',
  description: 'Descripción larga',
  price: 120,
  currency: 'USD',
  imageUrls: [],
  features: ['550W'],
  provider: 'Jinko',
  scope: 'equipment_only',
  isActive: true,
  isFeatured: false,
  sortOrder: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides
});

describe('catalog-usecases', () => {
  let repo: CatalogRepository;

  beforeEach(() => {
    repo = {
      listActive: vi.fn(),
      listAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn()
    };
  });

  it('ListActiveCatalogItems delega en repository.listActive', async () => {
    const items = [sampleItem()];
    vi.mocked(repo.listActive).mockResolvedValue(items);

    const result = await new ListActiveCatalogItems(repo).execute();

    expect(repo.listActive).toHaveBeenCalledOnce();
    expect(result).toEqual(items);
  });

  it('ListCatalogItems delega en repository.listAll', async () => {
    const items = [sampleItem({ isActive: false })];
    vi.mocked(repo.listAll).mockResolvedValue(items);

    const result = await new ListCatalogItems(repo).execute();

    expect(repo.listAll).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
  });

  it('CreateCatalogItem pasa el input al repository', async () => {
    const input = {
      type: 'product' as const,
      category: 'batteries' as const,
      name: 'Batería 5kWh',
      shortDescription: 'LiFePO4',
      description: 'Batería',
      currency: 'USD',
      imageUrls: [],
      features: [],
      isActive: true,
      isFeatured: false,
      sortOrder: 2
    };
    const created = sampleItem({ id: 'new', name: input.name });
    vi.mocked(repo.create).mockResolvedValue(created);

    const result = await new CreateCatalogItem(repo).execute(input);

    expect(repo.create).toHaveBeenCalledWith(input);
    expect(result.id).toBe('new');
  });

  it('UpdateCatalogItem actualiza por id', async () => {
    const updated = sampleItem({ name: 'Panel 600W' });
    vi.mocked(repo.update).mockResolvedValue(updated);

    const result = await new UpdateCatalogItem(repo).execute('cat-1', { name: 'Panel 600W' });

    expect(repo.update).toHaveBeenCalledWith('cat-1', { name: 'Panel 600W' });
    expect(result.name).toBe('Panel 600W');
  });

  it('RemoveCatalogItem elimina por id', async () => {
    vi.mocked(repo.remove).mockResolvedValue(undefined);

    await new RemoveCatalogItem(repo).execute('cat-1');

    expect(repo.remove).toHaveBeenCalledWith('cat-1');
  });
});
