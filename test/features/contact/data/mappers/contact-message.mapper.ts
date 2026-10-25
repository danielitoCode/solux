import { describe, it, expect } from 'vitest';
import { mapContactMessageDto } from '$features/contact/data/mappers/contact-message.mapper';
import type { ContactMessageDto } from '$features/contact/data/dto/contact-message.dto';

describe('contact-message.mapper', () => {
  it('defaults', () => {
    const m = mapContactMessageDto({
      id: 'm1', name: 'C', email: 'c@t.com', phone: null, subject: 'S', message: 'M',
      is_read: false, source: null, intent: null, created_at: '2026-01-01'
    } as ContactMessageDto);
    expect(m.source).toBe('direct');
    expect(m.intent).toBe('contact');
  });
  it('respeta lead', () => {
    const m = mapContactMessageDto({
      id: 'm1', name: 'C', email: 'c@t.com', phone: '809', subject: 'S', message: 'M',
      is_read: true, source: 'catalog', intent: 'buy', created_at: '2026-01-01'
    } as ContactMessageDto);
    expect(m.source).toBe('catalog');
    expect(m.intent).toBe('buy');
  });
});
