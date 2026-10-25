import { describe, it, expect } from 'vitest';
import { mapPageContentDto, toPageContentDto } from '$features/presentation/data/mappers/page-content.mapper';
import { emptyPageContent } from '$features/presentation/domain/entities/page-content';
import type { SiteContentDto } from '$features/presentation/data/dto/page-content.dto';

describe('page-content.mapper', () => {
  it('mapPageContentDto con null usa emptyPageContent', () => {
    const c = mapPageContentDto(null);
    expect(c).toEqual(emptyPageContent());
  });

  it('mapPageContentDto mergea content sobre defaults', () => {
    const dto = {
      page_slug: 'home',
      content: {
        eyebrow: 'Eyebrow',
        title: 'Título',
        description: 'Desc',
        secondary_title: '',
        secondary_description: '',
        image_1: '',
        image_2: '',
        image_3: '',
        image_4: ''
      },
      updated_at: '2026-01-01'
    } as SiteContentDto;

    const c = mapPageContentDto(dto);
    expect(c.title).toBe('Título');
    expect(c.eyebrow).toBe('Eyebrow');
  });

  it('toPageContentDto serializa camelCase → snake_case', () => {
    const row = toPageContentDto({
      ...emptyPageContent(),
      title: 'Home',
      secondaryTitle: 'Sec',
      image1: 'https://cdn/a.jpg'
    });
    expect(row.title).toBe('Home');
    expect(row.secondary_title).toBe('Sec');
    expect(row.image_1).toBe('https://cdn/a.jpg');
  });
});
