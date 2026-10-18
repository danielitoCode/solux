/**
 * Domain entity: Company public profile for presentation.
 */
export interface CompanyProfile {
  id: string;
  name: string;
  tagline: string;
  about: string;
  mission: string;
  vision: string;
  yearsOfExperience: number;
  completedProjects: number;
}
