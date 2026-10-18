import type { CatalogItem } from '../entities';

export interface CatalogRepository {
  listActive(): Promise<CatalogItem[]>;
  listAll(): Promise<CatalogItem[]>;
  create(item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<CatalogItem>;
  update(id: string, patch: Partial<CatalogItem>): Promise<CatalogItem>;
  remove(id: string): Promise<void>;
}
