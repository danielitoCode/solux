import type { CompanyProfile } from '../../domain/entities/company-profile';
import type { CompanyProfileDto } from '../dto/company-profile.dto';

export function mapCompanyProfileDto(dto: CompanyProfileDto | null): CompanyProfile | null {
  if (!dto) return null;
  return {
    id: dto.id,
    name: dto.name,
    tagline: dto.tagline,
    about: dto.about,
    mission: dto.mission,
    vision: dto.vision,
    yearsOfExperience: dto.years_of_experience,
    completedProjects: dto.completed_projects
  };
}
