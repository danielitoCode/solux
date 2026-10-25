// @vitest-environment happy-dom
/**
 * Prueba de UI (component) — espejo de
 * src/features/presentation/ui/components/EquipmentInstallFaq.svelte
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EquipmentInstallFaq from '$features/presentation/ui/components/EquipmentInstallFaq.svelte';

describe('EquipmentInstallFaq (UI)', () => {
  it('renderiza título y primera pregunta abierta', () => {
    render(EquipmentInstallFaq);

    expect(screen.getByRole('heading', { name: /equipo vs instalación/i })).toBeInTheDocument();
    expect(screen.getByText(/¿Solo compro el equipo o también instalan\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Puedes consultar un equipo/i)).toBeInTheDocument();
  });

  it('toggle cierra y abre secciones del accordion', async () => {
    render(EquipmentInstallFaq);

    const firstBtn = screen.getByRole('button', {
      name: /¿Solo compro el equipo o también instalan\?/i
    });
    expect(firstBtn).toHaveAttribute('aria-expanded', 'true');

    await fireEvent.click(firstBtn);
    expect(firstBtn).toHaveAttribute('aria-expanded', 'false');

    const secondBtn = screen.getByRole('button', {
      name: /¿Qué incluye “instalar con kit”\?/i
    });
    await fireEvent.click(secondBtn);
    expect(secondBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Dimensionamiento según tu consumo/i)).toBeInTheDocument();
  });

  it('expone CTAs a catálogo y reservas con source=faq', () => {
    render(EquipmentInstallFaq);

    const catalog = screen.getByRole('link', { name: /ver catálogo/i });
    expect(catalog).toHaveAttribute('href', '/catalogo?source=faq');

    const visit = screen.getByRole('link', { name: /solicitar visita técnica/i });
    expect(visit.getAttribute('href')).toContain('intent=install');
    expect(visit.getAttribute('href')).toContain('source=faq');
  });
});
