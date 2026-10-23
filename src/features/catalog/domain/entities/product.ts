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

/** Alcance comercial de la oferta (qué incluye). */
export type CatalogScope =
  | 'equipment_only'
  | 'kit_install'
  | 'install_only'
  | 'maintenance'
  | 'advisory'
  | 'custom';

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  category: CatalogCategory;
  name: string;
  shortDescription: string;
  description: string;
  price?: number;
  currency: string;
  /** @deprecated prefer imageUrls */
  imageUrl?: string;
  /** URLs Cloudinary (múltiples fotos) */
  imageUrls: string[];
  features: string[];
  /** Marca / proveedor del equipo (texto libre). */
  provider?: string;
  /** Qué incluye la oferta. */
  scope?: CatalogScope | string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
