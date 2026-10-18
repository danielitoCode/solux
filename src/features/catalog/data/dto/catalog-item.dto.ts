import type { CatalogCategory, CatalogItemType } from '../../domain/entities';

export interface CatalogItemDto {
  id: string;
  type: CatalogItemType;
  category: CatalogCategory;
  name: string;
  short_description: string;
  description: string;
  price: number | null;
  currency: string;
  image_url: string | null;
  image_urls?: string[] | null;
  features: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
