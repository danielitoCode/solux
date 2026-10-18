export type PageSlug = 'inicio' | 'servicios' | 'proyectos' | 'nosotros';

export type PageContent = {
  eyebrow: string;
  title: string;
  description: string;
  secondaryTitle: string;
  secondaryDescription: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
};

export const emptyPageContent = (): PageContent => ({
  eyebrow: '',
  title: '',
  description: '',
  secondaryTitle: '',
  secondaryDescription: '',
  image1: '',
  image2: '',
  image3: '',
  image4: ''
});
