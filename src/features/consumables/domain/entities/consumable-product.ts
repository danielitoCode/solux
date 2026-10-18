export interface ConsumableProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  description: string;
  defaultCost: number;
  defaultMarkupPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ConsumableProductInput = Omit<ConsumableProduct, 'id' | 'createdAt' | 'updatedAt'>;
