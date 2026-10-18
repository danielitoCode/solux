<script lang="ts">
  import { page } from '$app/stores';
  import {
    SITE,
    absoluteUrl,
    buildOrganizationJsonLd,
    buildWebSiteJsonLd,
    seoForPath,
    type SeoPageConfig
  } from './site';

  type Props = {
    title?: string;
    description?: string;
    path?: string;
    image?: string;
    noindex?: boolean;
    type?: 'website' | 'article';
    jsonLd?: 'none' | 'organization' | 'website' | 'both';
  };

  let {
    title,
    description,
    path,
    image,
    noindex,
    type = 'website',
    jsonLd = 'none'
  }: Props = $props();

  const resolved = $derived.by((): SeoPageConfig & { canonical: string; ogImage: string; siteOrigin: string } => {
    const base = seoForPath(path ?? $page.url.pathname);
    const siteOrigin = SITE.url || ($page.url.host && !$page.url.host.includes('localhost') ? $page.url.origin : '');
    const finalPath = path ?? base.path;
    const img = image ?? base.image ?? SITE.defaultImage;
    return {
      ...base,
      title: title ?? base.title,
      description: description ?? base.description,
      noindex: noindex ?? base.noindex,
      path: finalPath,
      canonical: absoluteUrl(finalPath, siteOrigin),
      ogImage: absoluteUrl(img, siteOrigin),
      siteOrigin
    };
  });

  const orgJson = $derived(
    jsonLd === 'organization' || jsonLd === 'both'
      ? JSON.stringify(buildOrganizationJsonLd(resolved.siteOrigin))
      : ''
  );
  const siteJson = $derived(
    jsonLd === 'website' || jsonLd === 'both'
      ? JSON.stringify(buildWebSiteJsonLd(resolved.siteOrigin))
      : ''
  );
</script>

<svelte:head>
  <title>{resolved.title}</title>
  <meta name="description" content={resolved.description} />
  <meta name="keywords" content={SITE.keywords.join(', ')} />
  <meta name="author" content={SITE.name} />
  <meta name="theme-color" content={SITE.themeColor} />

  {#if resolved.noindex}
    <meta name="robots" content="noindex, nofollow" />
    <meta name="googlebot" content="noindex, nofollow" />
  {:else}
    <meta
      name="robots"
      content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    />
  {/if}

  {#if resolved.canonical.startsWith('http')}
    <link rel="canonical" href={resolved.canonical} />
    <meta property="og:url" content={resolved.canonical} />
  {/if}

  <meta property="og:locale" content={SITE.locale} />
  <meta property="og:type" content={type} />
  <meta property="og:site_name" content={SITE.name} />
  <meta property="og:title" content={resolved.title} />
  <meta property="og:description" content={resolved.description} />
  <meta property="og:image" content={resolved.ogImage} />
  <meta property="og:image:alt" content="{SITE.name} — energía solar en Guantánamo" />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={resolved.title} />
  <meta name="twitter:description" content={resolved.description} />
  <meta name="twitter:image" content={resolved.ogImage} />

  <meta name="geo.region" content={SITE.geo.region} />
  <meta name="geo.placename" content={SITE.geo.placename} />
  <meta name="geo.position" content="{SITE.geo.latitude};{SITE.geo.longitude}" />
  <meta name="ICBM" content="{SITE.geo.latitude}, {SITE.geo.longitude}" />

  {#if orgJson}
    {@html `<script type="application/ld+json">${orgJson}</script>`}
  {/if}
  {#if siteJson}
    {@html `<script type="application/ld+json">${siteJson}</script>`}
  {/if}
</svelte:head>
