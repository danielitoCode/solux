import type { ConsumableProduct, ConsumableProductInput } from '../../domain/entities/consumable-product';
import type { ConsumableRepository } from '../../domain/repository/consumable-repository';
import { ConsumableRemoteDataSource } from '../datasources/remote/consumable-remote-datasource';

type Row = Awaited<ReturnType<ConsumableRemoteDataSource['list']>>[number];
const map = (row: Row): ConsumableProduct => ({ id: row.id, name: row.name, sku: row.sku, category: row.category, unit: row.unit, description: row.description, defaultCost: row.default_cost, defaultMarkupPercent: row.default_markup_percent, isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at });
const toRow = (input: ConsumableProductInput) => ({ name: input.name, sku: input.sku, category: input.category, unit: input.unit, description: input.description, default_cost: input.defaultCost, default_markup_percent: input.defaultMarkupPercent, is_active: input.isActive });

export class ConsumableRepositoryImpl implements ConsumableRepository {
  constructor(private readonly remote = new ConsumableRemoteDataSource()) {}
  async list() { return (await this.remote.list()).map(map); }
  async create(input: ConsumableProductInput) { return map(await this.remote.create(toRow(input))); }
  async update(id: string, input: ConsumableProductInput) { return map(await this.remote.update(id, toRow(input))); }
  async toggle(id: string, isActive: boolean) { return map(await this.remote.toggle(id, isActive)); }
}
