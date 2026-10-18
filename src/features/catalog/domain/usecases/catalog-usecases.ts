import type { CatalogItem } from '../entities';
import type { CatalogRepository } from '../repository/catalog-repository';

type CatalogItemInput = Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>;

export class ListActiveCatalogItems {
  constructor(private readonly repository: CatalogRepository) {}

  execute(): Promise<CatalogItem[]> {
    return this.repository.listActive();
  }
}

export class ListCatalogItems {
  constructor(private readonly repository: CatalogRepository) {}

  execute(): Promise<CatalogItem[]> {
    return this.repository.listAll();
  }
}

export class CreateCatalogItem {
  constructor(private readonly repository: CatalogRepository) {}

  execute(item: CatalogItemInput): Promise<CatalogItem> {
    return this.repository.create(item);
  }
}

export class UpdateCatalogItem {
  constructor(private readonly repository: CatalogRepository) {}

  execute(id: string, patch: Partial<CatalogItem>): Promise<CatalogItem> {
    return this.repository.update(id, patch);
  }
}

export class RemoveCatalogItem {
  constructor(private readonly repository: CatalogRepository) {}

  execute(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
