# Platform Updates Core V2 — Plan de acción

Rama: `platform-updates-coreV2`

## Iteración A (esta rama)

| # | Tarea | Estado |
|---|--------|--------|
| A1 | Migración source + intent | SQL `021_lead_intent_source.sql` |
| A2 | RPCs create_* con p_source / p_intent | Sí |
| A3 | Front lead-context + formularios | reservas, soporte, contacto |
| A4 | Home: tres rutas comprar / instalar / mantener | Sí |
| A5 | CTAs catálogo con intent | Sí |
| A6 | Aplicar migración en Supabase | pendiente |
| A7 | Deploy Render | pendiente |

## Iteración B

- Backoffice chips source/intent
- Catálogo: consultar equipo + instalar con kit
- Campos proveedor / alcance en ofertas

## Iteración C

- Datos comerciales reales
- Proyectos con evidencia
- FAQ equipo vs instalación

## Iteración D

- Proveedores + comisión backoffice
- Landing Facebook + source=facebook

## Deploy

1. Ejecutar `021_lead_intent_source.sql` en Supabase
2. Deploy front `platform-updates-coreV2`
3. Probar home → cada ruta → verificar source/intent en BD
