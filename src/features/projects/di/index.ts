import { ProjectRepositoryImpl } from '../data/repository/project-repository-impl';
import { CreateProject, ListProjects, RemoveProject, UpdateProject } from '../domain/usecases/project-usecases';
const repository = new ProjectRepositoryImpl();
export function getProjectUseCases() { return { list: new ListProjects(repository), create: new CreateProject(repository), update: new UpdateProject(repository), remove: new RemoveProject(repository) }; }
