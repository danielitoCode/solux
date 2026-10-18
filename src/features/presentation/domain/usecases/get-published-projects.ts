import type { ProjectCardDto } from '../../data/dto/project-card.dto';
import type { PresentationRepository } from '../repository/presentation-repository';

export class GetPublishedProjects {
  constructor(private readonly repository: PresentationRepository) {}

  execute(): Promise<ProjectCardDto[]> {
    return this.repository.getPublishedProjects();
  }
}
