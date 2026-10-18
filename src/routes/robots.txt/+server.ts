import { SITE } from '$infrastructure/seo/site';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = ({ url }) => {
  const origin = SITE.url || url.origin;
  const body = `# SOLUX
User-agent: *
Allow: /

Disallow: /backoffice
Disallow: /backoffice/

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
};
