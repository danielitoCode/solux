/** Configuración SEO / marca del sitio público SOLUX */
export const SITE = {
  name: 'SOLUX',
  legalName: 'SOLUX — Energía solar e ingeniería eléctrica',
  /** URL canónica del sitio (sin barra final). Configurar en .env como VITE_SITE_URL */
  url: ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, ''),
  locale: 'es_CU',
  language: 'es',
  description:
    'Instalación de paneles solares, kits solares, estaciones de energía, puesta a tierra y arreglos eléctricos en Guantánamo, Cuba. Ingeniería cercana y resultados medibles.',
  keywords: [
    'paneles solares',
    'energía solar',
    'kit solar',
    'instalación solar',
    'Guantánamo',
    'Cuba',
    'ingeniería eléctrica',
    'puesta a tierra',
    'estaciones de energía',
    'SOLUX'
  ],
  /** Icono limpio de marca (static/solux_icon_clean.svg) */
  icon: '/solux_icon_clean.svg',
  favicon: '/solux_icon_clean.svg',
  /** Imagen social por defecto (Open Graph / Twitter). Preferir PNG/JPG 1200×630 en producción. */
  defaultImage: '/solux_icon_clean.svg',
  themeColor: '#08783e',
  backgroundColor: '#f5f8f4',
  geo: {
    region: 'CU-14',
    placename: 'Guantánamo',
    country: 'Cuba',
    latitude: 20.1444,
    longitude: -75.2092
  },
  contact: {
    email: '',
    phone: '',
    areaServed: 'Guantánamo, Cuba'
  }
} as const;

export type SeoPageConfig = {
  title: string;
  description: string;
  path: string;
  /** Si true, no indexar (backoffice, utilidades internas) */
  noindex?: boolean;
  image?: string;
  type?: 'website' | 'article';
};

/** Metadatos por ruta pública */
export const PUBLIC_PAGES: SeoPageConfig[] = [
  {
    path: '/',
    title: 'SOLUX | Energía solar e ingeniería eléctrica en Guantánamo',
    description:
      'Diseño e instalación de sistemas solares, kits solares, estaciones de energía y soluciones eléctricas en Guantánamo, Cuba.'
  },
  {
    path: '/servicios',
    title: 'Servicios de instalación solar y eléctrica | SOLUX',
    description:
      'Paneles solares, kits solares, estaciones de energía, puesta a tierra, arreglos e instalaciones eléctricas. Solicita una evaluación con SOLUX.'
  },
  {
    path: '/catalogo',
    title: 'Catálogo de productos y servicios solares | SOLUX',
    description:
      'Explora kits solares, equipos y servicios de instalación. Carta de productos y soluciones energéticas SOLUX.'
  },
  {
    path: '/proyectos',
    title: 'Proyectos e instalaciones solares | SOLUX',
    description:
      'Casos reales de instalaciones solares y eléctricas realizadas por SOLUX en Guantánamo y alrededores.'
  },
  {
    path: '/nosotros',
    title: 'Sobre nosotros | SOLUX Guantánamo',
    description:
      'Conoce a SOLUX: empresa de energía solar e ingeniería eléctrica comprometida con resultados medibles en Cuba.'
  },
  {
    path: '/contacto',
    title: 'Contacto | SOLUX',
    description:
      'Habla con el equipo SOLUX sobre tu proyecto solar o eléctrico. Atención en Guantánamo, Cuba.'
  },
  {
    path: '/reservas',
    title: 'Reservar instalación o evaluación | SOLUX',
    description:
      'Agenda una visita o evaluación para instalación de paneles solares, kits o trabajos eléctricos con SOLUX.'
  },
  {
    path: '/seguimiento',
    title: 'Seguimiento de reserva o ticket | SOLUX',
    description:
      'Consulta el estado de tu reserva o ticket de soporte con el código de seguimiento SOLUX.'
  },
  {
    path: '/soporte',
    title: 'Soporte técnico | SOLUX',
    description:
      'Abre un ticket de soporte técnico para instalaciones solares y eléctricas SOLUX. Seguimiento por código.'
  }
];

export function seoForPath(pathname: string): SeoPageConfig {
  const path = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  if (path.startsWith('/backoffice')) {
    return {
      path,
      title: 'Backoffice | SOLUX',
      description: 'Área interna SOLUX.',
      noindex: true
    };
  }
  return (
    PUBLIC_PAGES.find((p) => p.path === path) ?? {
      path,
      title: `${SITE.name} | Energía solar`,
      description: SITE.description
    }
  );
}

export function absoluteUrl(path: string, siteUrl = SITE.url): string {
  const base = siteUrl || '';
  if (!base) return path;
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildOrganizationJsonLd(siteUrl = SITE.url) {
  const id = siteUrl ? `${siteUrl}/#organization` : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': id,
    name: SITE.name,
    legalName: SITE.legalName,
    description: SITE.description,
    url: siteUrl || undefined,
    image: absoluteUrl(SITE.defaultImage, siteUrl),
    logo: absoluteUrl(SITE.icon, siteUrl),
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.geo.placename,
      addressCountry: 'CU',
      addressRegion: 'Guantánamo'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: SITE.contact.areaServed
    },
    knowsAbout: [
      'Solar energy',
      'Photovoltaic installation',
      'Electrical engineering',
      'Energy storage'
    ],
    keywords: SITE.keywords.join(', ')
  };
}

export function buildWebSiteJsonLd(siteUrl = SITE.url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: siteUrl || undefined,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: absoluteUrl(SITE.icon, siteUrl)
    }
  };
}
