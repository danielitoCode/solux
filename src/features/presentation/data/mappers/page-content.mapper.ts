import { emptyPageContent, type PageContent } from '../../domain/entities/page-content';
import type { PageContentDto, SiteContentDto } from '../dto/page-content.dto';

export function mapPageContentDto(dto: SiteContentDto | null): PageContent {
  return {
    ...emptyPageContent(),
    ...(dto?.content ?? {})
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
