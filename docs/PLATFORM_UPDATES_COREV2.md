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
| A7 | Deploy Render | **Pendiente** |

### Notas A (UI home)

- Home restaurada con estilos de master + `import './HomePage.css'`.
- Intensidad de sol/glow de fondo reducida para legibilidad del hero.

## Iteración B — pendiente

- Backoffice: chips / filtros por `source` e `intent`
- Catálogo: consultar equipo + instalar con kit
- Campos proveedor / alcance en ofertas

## Iteración C — pendiente

- Datos comerciales reales
- Proyectos con evidencia
- FAQ equipo vs instalación

## Iteración D — pendiente

- Proveedores + comisión backoffice
- Landing Facebook + `source=facebook`

## Deploy (checklist)

1. [x] Ejecutar `021_lead_intent_source.sql` en Supabase
2. [ ] Deploy front `platform-updates-coreV2` (o merge → master)
3. [ ] Probar home → cada ruta → verificar `source` / `intent` en BD
