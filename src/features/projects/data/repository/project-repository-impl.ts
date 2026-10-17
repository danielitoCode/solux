import type { Project, ProjectInput } from '../../domain/entities/project';
import type { ProjectRepository } from '../../domain/repository/project-repository';
import { ProjectRemoteDataSource } from '../datasources/remote/project-remote-datasource';
type Row = Awaited<ReturnType<ProjectRemoteDataSource['list']>>[number];
const map = (row: Row): Project => ({ id: row.id, title: row.title, slug: row.slug, location: row.location, category: row.category, systemName: row.system_name, capacityKw: row.capacity_kw, inverter: row.inverter, panels: row.panels, battery: row.battery, description: row.description, specifications: row.specifications, gallery: row.gallery, layout: row.layout, isPublished: row.is_published, sortOrder: row.sort_order, createdAt: row.created_at, updatedAt: row.updated_at });
const toRow = (input: ProjectInput) => ({ title: input.title, slug: input.slug, location: input.location, category: input.category, system_name: input.systemName, capacity_kw: input.capacityKw, inverter: input.inverter, panels: input.panels, battery: input.battery, description: input.description, specifications: input.specifications, gallery: input.gallery, layout: input.layout, is_published: input.isPublished, sort_order: input.sortOrder });
export class ProjectRepositoryImpl implements ProjectRepository {
  constructor(private readonly remote = new ProjectRemoteDataSource()) {}
  async list() { return (await this.remote.list()).map(map); }
  async create(input: ProjectInput) { return map(await this.remote.create(toRow(input))); }
  async update(id: string, input: ProjectInput) { return map(await this.remote.update(id, toRow(input))); }
  async remove(id: string) { await this.remote.remove(id); }
}
