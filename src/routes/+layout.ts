import { publicContactUseCases } from '$features/contact/di/public-contact';
import { supabaseConfigured } from '$infrastructure/data/supabase-client';

// Sitio estático: páginas públicas se generan en build; backoffice usa SPA (fallback 200.html)
export const prerender = true;

export type PublicBrand = {
  name: string;
  logoUrl: string;
};

const FALLBACK_BRAND: PublicBrand = {
  name: 'SOLUX',
  logoUrl: ''
};

/** Cache de módulo: el root layout no debe volver a pegarle a Supabase en cada click del menú. */
let brandCache: { value: PublicBrand; at: number } | null = null;
const BRAND_TTL_MS = 5 * 60_000;

/**
 * Brand compartido (Header/Footer): una sola lectura de company_profile por TTL.
 */
export const load = async ({ url }) => {
  if (url.pathname.startsWith('/backoffice')) {
    return { publicBrand: FALLBACK_BRAND };
  }

  if (!supabaseConfigured) {
    return { publicBrand: FALLBACK_BRAND };
  }

  const now = Date.now();
  if (brandCache && now - brandCache.at < BRAND_TTL_MS) {
    return { publicBrand: brandCache.value };
  }

  try {
    const data = await publicContactUseCases.getCompanyProfile.execute();
    const publicBrand: PublicBrand = {
      name: data?.name?.trim() || FALLBACK_BRAND.name,
      logoUrl: data?.logo_url?.trim() || FALLBACK_BRAND.logoUrl
    };
    brandCache = { value: publicBrand, at: now };
    return { publicBrand };
  } catch {
    if (brandCache) return { publicBrand: brandCache.value };
    return { publicBrand: FALLBACK_BRAND };
  }
};
