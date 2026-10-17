export type ProjectCardLayout = 'hero-left' | 'editorial' | 'gallery-grid' | 'technical-report';

export type ProjectCardDto = {
  id: string;
  title: string;
  location: string;
  category: string;
  system_name: string;
  capacity_kw: number | null;
  inverter: string;
  panels: string;
  battery: string;
  description: string;
  specifications: { label: string; value: string }[] | null;
  gallery: string[] | null;
  layout: ProjectCardLayout;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};
