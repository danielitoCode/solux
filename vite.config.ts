import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    // Builds cliente de Svelte en tests UI
    conditions: ['browser', 'import', 'module', 'default']
  },
  test: {
    include: ['test/**/*.ts'],
    exclude: [
      'test/setup.ts',
      'test/mocks/**',
      'node_modules/**',
      '.svelte-kit/**'
    ],
    // forks + undici rompe en Windows (bind undefined). threads es estable.
    pool: 'threads',
    // Dominio/mappers: node. UI y lead-context: // @vitest-environment jsdom
    environment: 'node',
    environmentMatchGlobs: [
      ['test/**/ui/**', 'jsdom'],
      ['test/**/components/**', 'jsdom']
    ],
    globals: true,
    setupFiles: ['test/setup.ts'],
    alias: {
      $features: path.resolve('./src/features'),
      $infrastructure: path.resolve('./src/infrastructure'),
      $app: path.resolve('./test/mocks/app')
    },
    server: {
      deps: {
        inline: [/@testing-library\/svelte/, /svelte/]
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/features/**/domain/**',
        'src/features/**/data/mappers/**',
        'src/infrastructure/**'
      ],
      exclude: ['**/*.svelte', '**/index.ts', '**/database.types.ts']
    }
  }
});
