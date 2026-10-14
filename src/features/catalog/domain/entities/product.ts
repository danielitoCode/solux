/**
 * Domain entity: Product or service offered in the catalog (carta).
 */
export type CatalogItemType = 'product' | 'service';

export type CatalogCategory =
  | 'solar_panels'
  | 'inverters'
  | 'batteries'
  | 'solar_kits'
  | 'power_stations'
  | 'grounding'
  | 'electrical_installation'
  | 'electrical_repair'
  | 'maintenance'
  | 'advisory';

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  category: CatalogCategory;
  name: string;
  shortDescription: string;
  description: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
