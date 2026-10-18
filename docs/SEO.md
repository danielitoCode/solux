# SEO — SOLUX

## Icono de marca

El icono limpio debe estar en:

```text
static/solux_icon_clean.svg
```

En SvelteKit los archivos públicos se sirven desde **`static/`**.  
También puede existir una copia en `public/solux_icon_clean.svg`; mantén ambas sincronizadas.

## Variables de entorno

```env
VITE_SITE_URL=https://tu-dominio.com
```

Sin esta variable, canonical/Open Graph usan origen relativo o se omiten en local.

## Qué incluye

| Pieza | Ubicación |
|-------|-----------|
| Meta title/description, OG, Twitter, geo | `src/infrastructure/seo/Seo.svelte` |
| Textos por ruta + JSON-LD LocalBusiness | `src/infrastructure/seo/site.ts` |
| `robots.txt` | `src/routes/robots.txt/+server.ts` |
| `sitemap.xml` | `src/routes/sitemap.xml/+server.ts` |
| PWA manifest | `static/site.webmanifest` |
| Favicon / apple-touch | `src/app.html` → `/solux_icon_clean.svg` |

## Backoffice

Rutas `/backoffice/*` llevan `noindex, nofollow`.

## Checklist producción

1. `VITE_SITE_URL` = dominio real HTTPS  
2. `static/solux_icon_clean.svg` presente  
3. (Opcional) imagen OG 1200×630 PNG y actualizar `SITE.defaultImage`  
4. Enviar `https://tu-dominio.com/sitemap.xml` en Google Search Console  
5. Verificar rich results (LocalBusiness) en [Rich Results Test](https://search.google.com/test/rich-results)
