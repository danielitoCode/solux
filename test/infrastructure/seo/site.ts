import { describe, it, expect } from 'vitest';
import {
  SITE,
  PUBLIC_PAGES,
  seoForPath,
  absoluteUrl,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd
} from '$infrastructure/seo/site';

describe('seo/site', () => {
  it('SITE tiene marca SOLUX', () => {
    expect(SITE.name).toBe('SOLUX');
    expect(SITE.legalName).toContain('SOLUX');
  });

  it('PUBLIC_PAGES incluye rutas públicas clave', () => {
    const paths = PUBLIC_PAGES.map((p) => p.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/catalogo');
    expect(paths).toContain('/reservas');
    expect(paths).toContain('/contacto');
  });

  it('seoForPath normaliza trailing slash y noindex backoffice', () => {
    const home = seoForPath('/');
    expect(home.title).toBeTruthy();

    const catalog = seoForPath('/catalogo/');
    expect(catalog.path).toBe('/catalogo');

    const bo = seoForPath('/backoffice/reservas');
    expect(bo.noindex).toBe(true);
    expect(bo.title).toContain('Backoffice');
  });

  it('seoForPath usa fallback en rutas desconocidas', () => {
    const unknown = seoForPath('/ruta-inventada');
    expect(unknown.title).toContain(SITE.name);
  });

  it('absoluteUrl concatena base y path', () => {
    expect(absoluteUrl('/catalogo', 'https://solux.example')).toBe(
      'https://solux.example/catalogo'
    );
    expect(absoluteUrl('https://cdn.example/x.png', 'https://solux.example')).toBe(
      'https://cdn.example/x.png'
    );
    expect(absoluteUrl('/x', '')).toBe('/x');
  });

  it('buildOrganizationJsonLd y buildWebSiteJsonLd tienen @type schema.org', () => {
    const org = buildOrganizationJsonLd('https://solux.example');
    expect(org['@type']).toBe('LocalBusiness');
    expect(org.name).toBe('SOLUX');

    const web = buildWebSiteJsonLd('https://solux.example');
    expect(web['@type']).toBe('WebSite');
    expect(web.inLanguage).toBeTruthy();
  });
});
