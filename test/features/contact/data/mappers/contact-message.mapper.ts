import { describe, it, expect } from 'vitest';
import { mapContactMessageDto } from '$features/contact/data/mappers/contact-message.mapper';
import type { ContactMessageDto } from '$features/contact/data/dto/contact-message.dto';

const baseDto = (overrides: Partial<ContactMessageDto> = {}): ContactMessageDto => ({
  id: 'm1',
  name: 'C',
  email: 'c@t.com',
  phone: null,
  subject: 'general',
  message: 'M',
  is_read: false,
  assigned_to: null,
  source: null,
  intent: null,
  created_at: '2026-01-01',
  ...overrides
});

describe('contact-message.mapper', () => {
  it('defaults', () => {
    const m = mapContactMessageDto(baseDto());
    expect(m.source).toBe('direct');
    expect(m.intent).toBe('contact');
  });

  it('respeta lead', () => {
    const m = mapContactMessageDto(
      baseDto({
        phone: '809',
        is_read: true,
        source: 'catalog',
        intent: 'buy'
      })
    );
    expect(m.source).toBe('catalog');
    expect(m.intent).toBe('buy');
  });
});
