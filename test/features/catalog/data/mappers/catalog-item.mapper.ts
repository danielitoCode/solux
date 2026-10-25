import { describe, it, expect } from 'vitest';
import { mapCatalogItemDto, toCatalogInsert, toCatalogUpdate } from '$features/catalog/data/mappers/catalog-item.mapper';
import type { CatalogItemDto } from '$features/catalog/data/dto/catalog-item.dto';

const dto = (o: Partial<CatalogItemDto> = {}): CatalogItemDto => ({
  id: '1', type: 'product', category: 'solar_panels', name: 'Panel',
  short_description: 'corto', description: 'largo', price: 100, currency: 'USD',
  image_url: null, image_urls: ['https://a.jpg'], features: ['550W'],
  provider: '  Jinko  ', scope: ' equipment_only ', is_active: true, is_featured: false,
  sort_order: 1, created_at: '2026-01-01', updated_at: '2026-01-02', ...o
});

describe('catalog-item.mapper', () => {
  it('mapCatalogItemDto normaliza', () => {
    const item = mapCatalogItemDto(dto());
    expect(item.shortDescription).toBe('corto');
    expect(item.provider).toBe('Jinko');
    expect(item.scope).toBe('equipment_only');
    expect(item.imageUrls).toEqual(['https://a.jpg']);
  });
  it('fallback image_url', () => {
    const item = mapCatalogItemDto(dto({ image_urls: null, image_url: 'https://only.jpg' }));
    expect(item.imageUrls).toEqual(['https://only.jpg']);
  });
  it('toCatalogInsert', () => {
    const item = mapCatalogItemDto(dto());
    const row = toCatalogInsert({
      type: item.type, category: item.category, name: item.name,
      shortDescription: item.shortDescription, description: item.description,
      price: item.price, currency: item.currency, imageUrls: item.imageUrls,
      features: item.features, provider: item.provider, scope: item.scope,
      isActive: item.isActive, isFeatured: item.isFeatured, sortOrder: item.sortOrder
    });
    expect(row.short_description).toBe('corto');
    expect(row.provider).toBe('Jinko');
  });
  it('toCatalogUpdate partial', () => {
    expect(toCatalogUpdate({ name: 'N', provider: '  X  ' })).toEqual({ name: 'N', provider: 'X' });
  });
});
