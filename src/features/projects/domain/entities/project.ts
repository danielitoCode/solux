export type ProjectLayout = 'hero-left' | 'editorial' | 'gallery-grid' | 'technical-report';
export interface ProjectSpec { label: string; value: string; }
export interface Project { id: string; title: string; slug: string; location: string; category: string; systemName: string; capacityKw: number | null; inverter: string; panels: string; battery: string; description: string; specifications: ProjectSpec[]; gallery: string[]; layout: ProjectLayout; isPublished: boolean; sortOrder: number; createdAt: string; updatedAt: string; }
export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
