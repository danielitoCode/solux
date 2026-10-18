import { PUBLIC_PAGES, SITE } from '$infrastructure/seo/site';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = ({ url }) => {
  const origin = SITE.url || url.origin;
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = PUBLIC_PAGES.map((page) => {
    const loc = `${origin}${page.path === '/' ? '/' : page.path}`;
    const priority = page.path === '/' ? '1.0' : page.path === '/servicios' || page.path === '/catalogo' ? '0.9' : '0.7';
    const changefreq = page.path === '/' ? 'weekly' : 'monthly';
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
