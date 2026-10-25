import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project, ProjectInput } from '$features/projects/domain/entities/project';
import type { ProjectRepository } from '$features/projects/domain/repository/project-repository';
import { ListProjects, CreateProject, UpdateProject, RemoveProject } from '$features/projects/domain/usecases/project-usecases';

const project = (o: Partial<Project> = {}): Project => ({ id: 'p-1', title: 'Casa', ...o }) as Project;

describe('project-usecases', () => {
  let repo: ProjectRepository;
  beforeEach(() => { repo = { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }; });
  it('ListProjects', async () => {
    vi.mocked(repo.list).mockResolvedValue([project()]);
    expect(await new ListProjects(repo).execute()).toHaveLength(1);
  });
  it('CreateProject', async () => {
    const input = { title: 'N' } as ProjectInput;
    vi.mocked(repo.create).mockResolvedValue(project({ title: 'N' }));
    await new CreateProject(repo).execute(input);
    expect(repo.create).toHaveBeenCalledWith(input);
  });
  it('UpdateProject', async () => {
    const input = { title: 'E' } as ProjectInput;
    vi.mocked(repo.update).mockResolvedValue(project({ title: 'E' }));
    await new UpdateProject(repo).execute('p-1', input);
    expect(repo.update).toHaveBeenCalledWith('p-1', input);
  });
  it('RemoveProject', async () => {
    vi.mocked(repo.remove).mockResolvedValue(undefined);
    await new RemoveProject(repo).execute('p-1');
    expect(repo.remove).toHaveBeenCalledWith('p-1');
  });
});
