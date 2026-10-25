import { vi } from 'vitest';

// Solo aplica jest-dom y matchMedia cuando hay DOM (jsdom / UI)
const hasWindow = typeof window !== 'undefined';

if (hasWindow) {
  await import('@testing-library/jest-dom/vitest');

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}
