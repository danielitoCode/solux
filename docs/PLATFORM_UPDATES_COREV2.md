# Platform Updates Core V2 — Plan de acción

Rama: `platform-updates-coreV2`

## Iteración A (esta rama)

| # | Tarea | Estado |
|---|--------|--------|
| A1 | Migración source + intent | Hecho — SQL `021_lead_intent_source.sql` |
| A2 | RPCs create_* con p_source / p_intent | Hecho |
| A3 | Front lead-context + formularios | Hecho — reservas, soporte, contacto |
| A4 | Home: tres rutas comprar / instalar / mantener | Hecho — `ConversionPaths` |
| A5 | CTAs catálogo / reservas con intent + source | Hecho |
| A6 | Aplicar migración en Supabase | **Hecho** (021 aplicada) |
| A7 | Deploy Render | **Pendiente** (al final) |

### Notas A (UI home)

- Home restaurada con estilos de master + `import './HomePage.css'`.
- Intensidad de sol/glow de fondo reducida para legibilidad del hero.

## Iteración B

| # | Tarea | Estado |
|---|--------|--------|
| B1 | Backoffice: chips / filtros por `source` e `intent` (reservas, tickets, contacto) | **Hecho** |
| B2 | Catálogo: consultar equipo + instalar con kit | **Hecho** |
| B3 | Campos proveedor / alcance en ofertas | **Hecho** — migración `022`, BO + catálogo público |

## Iteración C

| # | Tarea | Estado |
|---|--------|--------|
| C1 | FAQ equipo vs instalación | **Hecho** — `EquipmentInstallFaq` en catálogo + servicios |
| C2 | Proyectos con evidencia | **Hecho** — seed 3 proyectos publicados (`023`) |
| C3 | Datos comerciales (provider/scope en catálogo) | **Hecho** — updates en `023` |

## Iteración D — pendiente

- Proveedores + comisión backoffice
- Landing Facebook + `source=facebook`

## Deploy (checklist)

1. [x] Ejecutar `021_lead_intent_source.sql` en Supabase
2. [x] Ejecutar `022_catalog_provider_scope.sql` en Supabase
3. [ ] Ejecutar `023_iter_c_commercial_projects.sql` en Supabase
4. [ ] Deploy front `platform-updates-coreV2` (o merge → master)
5. [ ] Probar home → cada ruta → verificar `source` / `intent` en BD
6. [ ] Probar FAQ + proyectos publicados + chips proveedor/alcance
