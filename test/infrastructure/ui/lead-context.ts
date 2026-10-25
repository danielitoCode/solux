import { describe, it, expect, afterEach } from 'vitest';
import {
  parseLeadIntent,
  parseLeadSource,
  readLeadFromLocation
} from '$infrastructure/ui/lead-context';

describe('lead-context', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    });
  });

  it('parseLeadIntent acepta valores válidos y fallback', () => {
    expect(parseLeadIntent('buy')).toBe('buy');
    expect(parseLeadIntent('INSTALL')).toBe('install');
    expect(parseLeadIntent('nope')).toBe('general');
    expect(parseLeadIntent('nope', 'contact')).toBe('contact');
    expect(parseLeadIntent(null)).toBe('general');
  });

  it('parseLeadSource acepta valores válidos y fallback', () => {
    expect(parseLeadSource('catalog')).toBe('catalog');
    expect(parseLeadSource('FACEBOOK')).toBe('facebook');
    expect(parseLeadSource('ads')).toBe('direct');
    expect(parseLeadSource(undefined, 'home')).toBe('home');
  });

  it('readLeadFromLocation lee query params', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('http://localhost/reservas?intent=install&source=catalog')
    });

    const lead = readLeadFromLocation();
    expect(lead.intent).toBe('install');
    expect(lead.source).toBe('catalog');
  });

  it('readLeadFromLocation usa defaults si faltan params', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('http://localhost/')
    });

    const lead = readLeadFromLocation({ intent: 'buy', source: 'home' });
    expect(lead.intent).toBe('buy');
    expect(lead.source).toBe('home');
  });
});
