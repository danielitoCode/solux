# Tests SOLUX (Vitest)

Estructura **espejo** de `src/`:

| Código | Test |
|--------|------|
| `src/features/catalog/domain/usecases/catalog-usecases.ts` | `test/features/catalog/domain/usecases/catalog-usecases.ts` |
| `src/infrastructure/ui/lead-labels.ts` | `test/infrastructure/ui/lead-labels.ts` |

## Comandos

```bash
npm run test           # una pasada
npm run test:watch     # watch
npm run test:coverage  # cobertura
```

## Alcance actual

- **Unitarias de dominio** con repositorios mockeados (catalog, reservations, support, auth, finance)
- **Utilidades** lead-labels, lead-context, SEO site, motion
- **UI** `EquipmentInstallFaq` con Testing Library + jsdom

## Convención

1. Misma ruta relativa bajo `test/` que bajo `src/`.
2. Mismo nombre de archivo (sin `.test.` / `.spec.`).
3. Vitest incluye `test/**/*.ts` (excepto `test/setup.ts` y `test/mocks/**`).
