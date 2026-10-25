import { describe, it, expect } from 'vitest';
import {
  INTENT_LABELS,
  SOURCE_LABELS,
  intentLabel,
  sourceLabel
} from '$infrastructure/ui/lead-labels';

describe('lead-labels', () => {
  it('tiene etiquetas de intent comerciales', () => {
    expect(INTENT_LABELS.buy).toBe('Comprar');
    expect(INTENT_LABELS.install).toBe('Instalar');
    expect(INTENT_LABELS.maintain).toBe('Mantener');
  });

  it('tiene etiquetas de source conocidas', () => {
    expect(SOURCE_LABELS.catalog).toBe('Catálogo');
    expect(SOURCE_LABELS.facebook).toBe('Facebook');
    expect(SOURCE_LABELS.home).toBe('Home');
  });

  it('intentLabel mapea o devuelve guion', () => {
    expect(intentLabel('buy')).toBe('Comprar');
    expect(intentLabel(null)).toBe('—');
    expect(intentLabel(undefined)).toBe('—');
    expect(intentLabel('custom_intent')).toBe('custom_intent');
  });

  it('sourceLabel mapea o devuelve guion', () => {
    expect(sourceLabel('catalog')).toBe('Catálogo');
    expect(sourceLabel('')).toBe('—');
    expect(sourceLabel('newsletter')).toBe('newsletter');
  });
});
