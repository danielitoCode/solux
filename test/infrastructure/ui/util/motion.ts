import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('motion utils', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ms devuelve el valor cuando no hay reduced motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    );
    const { ms } = await import('$infrastructure/ui/util/motion');
    expect(ms(300)).toBe(300);
  });

  it('ms devuelve 0 con prefers-reduced-motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((q: string) => ({
        matches: String(q).includes('prefers-reduced-motion'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    );
    const { ms } = await import('$infrastructure/ui/util/motion');
    expect(ms(300)).toBe(0);
  });

  it('reveal añade clase in si no hay IntersectionObserver', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    );
    // @ts-expect-error intentional
    globalThis.IntersectionObserver = undefined;

    const { reveal } = await import('$infrastructure/ui/util/motion');
    const node = { classList: { add: vi.fn() }, style: { setProperty: vi.fn() } } as unknown as HTMLElement;
    reveal(node, 100);
    expect(node.classList.add).toHaveBeenCalledWith('in');
  });
});
