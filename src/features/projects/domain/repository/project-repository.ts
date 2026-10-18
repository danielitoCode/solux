import type { Project, ProjectInput } from '../entities/project';
export interface ProjectRepository { list(): Promise<Project[]>; create(input: ProjectInput): Promise<Project>; update(id: string, input: ProjectInput): Promise<Project>; remove(id: string): Promise<void>; }
