// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ConversionPaths from '$features/presentation/ui/components/ConversionPaths.svelte';

describe('ConversionPaths (UI)', () => {
  it('renderiza las tres rutas comerciales', () => {
    render(ConversionPaths);
    expect(screen.getByText(/elige tu camino/i)).toBeInTheDocument();
    expect(screen.getByText(/quiero comprar un kit o equipo/i)).toBeInTheDocument();
    expect(screen.getByText(/ya tengo equipos o quiero instalar/i)).toBeInTheDocument();
    expect(screen.getByText(/necesito mantenimiento o reparación/i)).toBeInTheDocument();
  });

  it('enlaces llevan intent y source correctos', () => {
    render(ConversionPaths);
    const buy = screen.getByRole('link', { name: /quiero comprar/i });
    expect(buy.getAttribute('href')).toContain('intent=buy');
    expect(buy.getAttribute('href')).toContain('source=home');

    const install = screen.getByRole('link', { name: /ya tengo equipos/i });
    expect(install.getAttribute('href')).toContain('intent=install');

    const maintain = screen.getByRole('link', { name: /mantenimiento/i });
    expect(maintain.getAttribute('href')).toContain('intent=maintain');
  });
});
