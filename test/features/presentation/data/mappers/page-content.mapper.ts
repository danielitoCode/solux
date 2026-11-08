import { describe, it, expect } from 'vitest';
import { mapPageContentDto, toPageContentDto } from '$features/presentation/data/mappers/page-content.mapper';
import { emptyPageContent } from '$features/presentation/domain/entities/page-content';
import type { SiteContentDto } from '$features/presentation/data/dto/page-content.dto';

describe('page-content.mapper', () => {
  it('mapPageContentDto con null usa emptyPageContent', () => {
    const c = mapPageContentDto(null);
    expect(c).toEqual(emptyPageContent());
  });

  it('mapPageContentDto convierte snake_case → camelCase', () => {
    const dto = {
      page_slug: 'nosotros',
      content: {
        eyebrow: 'Eyebrow',
        title: 'Título',
        description: 'Desc',
        secondary_title: 'Valores',
        secondary_description: 'Hecho con criterio',
        image_1: 'https://cdn/hero.jpg',
        image_2: 'https://cdn/team.jpg',
        image_3: '',
        image_4: ''
      },
      updated_at: '2026-01-01'
    } as SiteContentDto;

    const c = mapPageContentDto(dto);
    expect(c.title).toBe('Título');
    expect(c.eyebrow).toBe('Eyebrow');
    expect(c.secondaryTitle).toBe('Valores');
    expect(c.secondaryDescription).toBe('Hecho con criterio');
    expect(c.image1).toBe('https://cdn/hero.jpg');
    expect(c.image2).toBe('https://cdn/team.jpg');
  });

  it('toPageContentDto serializa camelCase → snake_case', () => {
    const row = toPageContentDto({
      ...emptyPageContent(),
      title: 'Home',
      secondaryTitle: 'Sec',
      image1: 'https://cdn/a.jpg',
      image2: 'https://cdn/b.jpg'
    });
    expect(row.title).toBe('Home');
    expect(row.secondary_title).toBe('Sec');
    expect(row.image_1).toBe('https://cdn/a.jpg');
    expect(row.image_2).toBe('https://cdn/b.jpg');
  });
});
