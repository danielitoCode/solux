import type { Project, ProjectInput } from '../entities/project';
import type { ProjectRepository } from '../repository/project-repository';
export class ListProjects { constructor(private readonly repository: ProjectRepository) {} execute(): Promise<Project[]> { return this.repository.list(); } }
export class CreateProject { constructor(private readonly repository: ProjectRepository) {} execute(input: ProjectInput): Promise<Project> { return this.repository.create(input); } }
export class UpdateProject { constructor(private readonly repository: ProjectRepository) {} execute(id: string, input: ProjectInput): Promise<Project> { return this.repository.update(id, input); } }
export class RemoveProject { constructor(private readonly repository: ProjectRepository) {} execute(id: string): Promise<void> { return this.repository.remove(id); } }
