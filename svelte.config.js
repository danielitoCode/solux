import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Carpeta que Render usa como Publish Directory
      pages: 'build',
      assets: 'build',
      // SPA fallback: backoffice y rutas no prerenderizadas
      fallback: '200.html',
      precompress: false,
      strict: true
    }),
    alias: {
      $features: 'src/features',
      $infrastructure: 'src/infrastructure'
    },
    prerender: {
      // No fallar el build si alguna ruta externa/relativa no resuelve en build
      handleHttpError: 'warn',
      handleMissingId: 'warn'
    }
  }
};

export default config;
