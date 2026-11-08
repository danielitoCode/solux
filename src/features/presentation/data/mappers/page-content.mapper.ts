import { emptyPageContent, type PageContent } from '../../domain/entities/page-content';
import type { PageContentDto, SiteContentDto } from '../dto/page-content.dto';

/**
 * Supabase guarda JSON en snake_case (image_1, secondary_title…).
 * El dominio BO usa camelCase (image1, secondaryTitle…).
 * Antes se hacía spread directo y las imágenes/títulos secundarios no persistían al recargar.
 */
export function mapPageContentDto(dto: SiteContentDto | null): PageContent {
  const raw = (dto?.content ?? {}) as Partial<PageContentDto> & Record<string, unknown>;

  return {
    ...emptyPageContent(),
    eyebrow: String(raw.eyebrow ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    secondaryTitle: String(raw.secondary_title ?? raw.secondaryTitle ?? ''),
    secondaryDescription: String(raw.secondary_description ?? raw.secondaryDescription ?? ''),
    image1: String(raw.image_1 ?? raw.image1 ?? ''),
    image2: String(raw.image_2 ?? raw.image2 ?? ''),
    image3: String(raw.image_3 ?? raw.image3 ?? ''),
    image4: String(raw.image_4 ?? raw.image4 ?? '')
  };
}

export function toPageContentDto(content: PageContent): PageContentDto {
  return {
    eyebrow: content.eyebrow,
    title: content.title,
    description: content.description,
    secondary_title: content.secondaryTitle,
    secondary_description: content.secondaryDescription,
    image_1: content.image1,
    image_2: content.image2,
    image_3: content.image3,
    image_4: content.image4
  };
}
