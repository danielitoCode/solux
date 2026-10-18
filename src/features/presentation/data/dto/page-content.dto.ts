export type PageContentDto = {
  eyebrow: string;
  title: string;
  description: string;
  secondary_title: string;
  secondary_description: string;
  image_1: string;
  image_2: string;
  image_3: string;
  image_4: string;
};

export type SiteContentDto = {
  page_slug: string;
  content: PageContentDto;
  updated_at: string;
};
