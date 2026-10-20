# Despliegue estático en Render

SOLUX usa `@sveltejs/adapter-static`.

## Render → Static Site (no Web Service)

| Campo | Valor |
|--------|--------|
| **Branch** | `seo-update` (o la rama que despliegues) |
| **Root Directory** | *(vacío)* |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

No hay **Start Command** (eso es solo Web Service).

## Variables de entorno (en el build)

Las `VITE_*` deben estar definidas al **compilar**:

```env
NODE_VERSION=20
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SITE_URL=https://tu-sitio.onrender.com
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

## Rewrite (importante)

Para que rutas como `/backoffice/reservas` no den 404 al refrescar:

**Redirects/Rewrites** en el Static Site:

| Source | Destination | Action |
|--------|-------------|--------|
| `/*` | `/200.html` | **Rewrite** |

(El adaptador genera `build/200.html` como fallback SPA.)

## Comportamiento

- Páginas públicas: HTML generado en el build (mejor SEO).
- Backoffice: SPA en el cliente (Supabase Auth).
- `robots.txt` y `sitemap.xml`: se generan en el build.
