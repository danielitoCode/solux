import { describe, it, expect } from 'vitest';
import { mapCompanyProfileDto } from '$features/presentation/data/mappers/company-profile.mapper';
import type { CompanyProfileDto } from '$features/presentation/data/dto/company-profile.dto';

describe('company-profile.mapper', () => {
  it('devuelve null si dto es null', () => {
    expect(mapCompanyProfileDto(null)).toBeNull();
  });

  it('mapea campos comerciales', () => {
    const dto: CompanyProfileDto = {
      id: 'c1',
      name: 'SOLUX',
      tagline: 'Energía',
      about: 'Sobre',
      mission: 'Misión',
      vision: 'Visión',
      years_of_experience: 8,
      completed_projects: 40
    };
    const p = mapCompanyProfileDto(dto);
    expect(p?.name).toBe('SOLUX');
    expect(p?.yearsOfExperience).toBe(8);
    expect(p?.completedProjects).toBe(40);
  });
});
