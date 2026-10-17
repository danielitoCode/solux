import type { ConsumableProduct, ConsumableProductInput } from '../entities/consumable-product';
import type { ConsumableRepository } from '../repository/consumable-repository';

export class ListConsumables {
  constructor(private readonly repository: ConsumableRepository) {}
  execute(): Promise<ConsumableProduct[]> { return this.repository.list(); }
}

export class CreateConsumable {
  constructor(private readonly repository: ConsumableRepository) {}
  execute(input: ConsumableProductInput): Promise<ConsumableProduct> { return this.repository.create(input); }
}

export class UpdateConsumable {
  constructor(private readonly repository: ConsumableRepository) {}
  execute(id: string, input: ConsumableProductInput): Promise<ConsumableProduct> { return this.repository.update(id, input); }
}

export class ToggleConsumable {
  constructor(private readonly repository: ConsumableRepository) {}
  execute(product: ConsumableProduct): Promise<ConsumableProduct> { return this.repository.toggle(product.id, !product.isActive); }
}
