import { describe, it, expect } from 'vitest';
import { colors, radius } from '$infrastructure/ui/tokens';

describe('design tokens', () => {
  it('colors expone tokens CSS variables', () => {
    expect(colors.primary).toContain('--color-primary');
    expect(colors.bg).toContain('--color-bg');
    expect(colors.text).toContain('--color-text');
  });

  it('radius expone escalas', () => {
    expect(radius.sm).toContain('--radius-sm');
    expect(radius.lg).toContain('--radius-lg');
    expect(radius['2xl']).toContain('--radius-2xl');
  });
});
