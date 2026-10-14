import type { CatalogRepository } from '../../domain/repository/catalog-repository';
import type { CatalogItem } from '../../domain/entities';
import { CatalogRemoteDataSource } from '../datasources/remote/catalog-remote-datasource';
import {
  mapCatalogItemDto,
  toCatalogInsert,
  toCatalogUpdate
} from '../mappers/catalog-item.mapper';

export class CatalogRepositoryImpl implements CatalogRepository {
  constructor(private readonly remote = new CatalogRemoteDataSource()) {}

  async listActive(): Promise<CatalogItem[]> {
    return (await this.remote.listActive()).map(mapCatalogItemDto);
  }

  async listAll(): Promise<CatalogItem[]> {
    return (await this.remote.listAll()).map(mapCatalogItemDto);
  }

  async create(
    item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CatalogItem> {
    return mapCatalogItemDto(await this.remote.insert(toCatalogInsert(item)));
  }

  async update(id: string, patch: Partial<CatalogItem>): Promise<CatalogItem> {
    return mapCatalogItemDto(await this.remote.update(id, toCatalogUpdate(patch)));
  }

  async remove(id: string): Promise<void> {
    await this.remote.remove(id);
  }
}
