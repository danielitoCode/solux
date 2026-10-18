import type { ConsumableProduct, ConsumableProductInput } from '../entities/consumable-product';

export interface ConsumableRepository {
  list(): Promise<ConsumableProduct[]>;
  create(input: ConsumableProductInput): Promise<ConsumableProduct>;
  update(id: string, input: ConsumableProductInput): Promise<ConsumableProduct>;
  toggle(id: string, isActive: boolean): Promise<ConsumableProduct>;
}
