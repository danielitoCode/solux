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

/**
 * Brand compartido (Header/Footer): una sola lectura de company_profile.
 * En build (prerender) el HTML ya lleva nombre/logo; sin fetch en onMount.
 */
export const load = async ({ url }) => {
  if (url.pathname.startsWith('/backoffice')) {
    return { publicBrand: FALLBACK_BRAND };
  }

  if (!supabaseConfigured) {
    return { publicBrand: FALLBACK_BRAND };
  }

  try {
    const data = await publicContactUseCases.getCompanyProfile.execute();
    return {
      publicBrand: {
        name: data?.name?.trim() || FALLBACK_BRAND.name,
        logoUrl: data?.logo_url?.trim() || FALLBACK_BRAND.logoUrl
      } satisfies PublicBrand
    };
  } catch {
    return { publicBrand: FALLBACK_BRAND };
  }
};
