import type { CatalogItem } from '../../domain/entities';
import type { CatalogItemDto } from '../dto/catalog-item.dto';

export function mapCatalogItemDto(dto: CatalogItemDto): CatalogItem {
  const urls =
    dto.image_urls && dto.image_urls.length > 0
      ? dto.image_urls
      : dto.image_url
        ? [dto.image_url]
        : [];

  return {
    id: dto.id,
    type: dto.type,
    category: dto.category,
    name: dto.name,
    shortDescription: dto.short_description,
    description: dto.description,
    price: dto.price ?? undefined,
    currency: dto.currency,
    imageUrl: urls[0],
    imageUrls: urls,
    features: dto.features ?? [],
    provider: dto.provider?.trim() || undefined,
    scope: dto.scope?.trim() || undefined,
    isActive: dto.is_active,
    isFeatured: dto.is_featured,
    sortOrder: dto.sort_order,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at
  };
}

export function toCatalogInsert(item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    type: item.type,
    category: item.category,
    name: item.name,
    short_description: item.shortDescription,
    description: item.description,
    price: item.price ?? null,
    currency: item.currency,
    image_url: item.imageUrls[0] ?? item.imageUrl ?? null,
    image_urls: item.imageUrls,
    features: item.features,
    provider: item.provider?.trim() || null,
    scope: item.scope?.trim() || null,
    is_active: item.isActive,
    is_featured: item.isFeatured,
    sort_order: item.sortOrder
  };
}

export function toCatalogUpdate(patch: Partial<CatalogItem>) {
  const row: Record<string, unknown> = {};
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.shortDescription !== undefined) row.short_description = patch.shortDescription;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.price !== undefined) row.price = patch.price ?? null;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.imageUrls !== undefined) {
    row.image_urls = patch.imageUrls;
    row.image_url = patch.imageUrls[0] ?? null;
  }
  if (patch.features !== undefined) row.features = patch.features;
  if (patch.provider !== undefined) row.provider = patch.provider?.trim() || null;
  if (patch.scope !== undefined) row.scope = patch.scope?.trim() || null;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  if (patch.isFeatured !== undefined) row.is_featured = patch.isFeatured;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  return row;
}
