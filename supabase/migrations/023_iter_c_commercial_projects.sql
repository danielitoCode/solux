-- Iteración C: datos comerciales (provider/scope en catálogo) + proyectos con evidencia
-- Requiere 022 (provider/scope columns). Idempotente.

-- ── Catálogo: marcas y alcance comercial ────────────────────────────
update public.catalog_items set
  provider = coalesce(nullif(trim(provider), ''), 'Jinko Solar'),
  scope = coalesce(nullif(trim(scope), ''), 'equipment_only')
where category = 'solar_panels';

update public.catalog_items set
  provider = coalesce(nullif(trim(provider), ''), 'Growatt'),
  scope = coalesce(nullif(trim(scope), ''), 'equipment_only')
where category = 'inverters';

update public.catalog_items set
  provider = coalesce(nullif(trim(provider), ''), 'Pylontech'),
  scope = coalesce(nullif(trim(scope), ''), 'equipment_only')
where category = 'batteries';

update public.catalog_items set
  provider = coalesce(nullif(trim(provider), ''), 'SOLUX Kit'),
  scope = coalesce(nullif(trim(scope), ''), 'kit_install')
where category = 'solar_kits';

update public.catalog_items set
  scope = coalesce(nullif(trim(scope), ''), 'install_only')
where category in ('electrical_installation', 'electrical_repair', 'grounding');

update public.catalog_items set
  scope = coalesce(nullif(trim(scope), ''), 'maintenance')
where category = 'maintenance';

update public.catalog_items set
  scope = coalesce(nullif(trim(scope), ''), 'advisory')
where category = 'advisory';

-- ── Proyectos publicados con evidencia (estructura real) ────────────
insert into public.site_projects (
  title, slug, location, category, system_name, capacity_kw,
  inverter, panels, battery, description, specifications, gallery,
  layout, is_published, sort_order
)
select
  'Residencial 3,3 kW · Guantánamo',
  'residencial-3kw-guantanamo',
  'Guantánamo, Cuba',
  'Residencial',
  'Kit híbrido residencial',
  3.3,
  'Híbrido 3,6 kW · MPPT dual',
  '6 × panel monocristalino 550 W',
  'LiFePO₄ 5,12 kWh',
  'Sistema dimensionado para una vivienda con refrigeración, iluminación LED y cargas esenciales. Visita técnica, montaje en techo de hormigón, puesta a tierra y configuración de modos de respaldo.',
  '[
    {"label":"Potencia FV","value":"3,3 kW"},
    {"label":"Autonomía estimada","value":"4–6 h cargas críticas"},
    {"label":"Estructura","value":"Aluminio · techo plano"},
    {"label":"Protecciones","value":"DC/AC + puesta a tierra"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'hero-left',
  true,
  1
where not exists (
  select 1 from public.site_projects where slug = 'residencial-3kw-guantanamo'
);

insert into public.site_projects (
  title, slug, location, category, system_name, capacity_kw,
  inverter, panels, battery, description, specifications, gallery,
  layout, is_published, sort_order
)
select
  'Comercio 5 kW · respaldo parcial',
  'comercio-5kw-respaldo',
  'Guantánamo, Cuba',
  'Comercial',
  'FV + respaldo de carga crítica',
  5.0,
  'Híbrido 5 kW',
  '10 × panel 500 W',
  'LiFePO₄ 10 kWh',
  'Instalación en local comercial con priorización de refrigeración y POS. Incluye cuadros de protección, etiquetado y formación básica al personal.',
  '[
    {"label":"Potencia FV","value":"5,0 kW"},
    {"label":"Modo","value":"Híbrido · red + batería"},
    {"label":"Monitoreo","value":"App del inversor"},
    {"label":"Entrega","value":"Informe de puesta en marcha"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1545208942-e1c9c8c6a6d1?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'technical-report',
  true,
  2
where not exists (
  select 1 from public.site_projects where slug = 'comercio-5kw-respaldo'
);

insert into public.site_projects (
  title, slug, location, category, system_name, capacity_kw,
  inverter, panels, battery, description, specifications, gallery,
  layout, is_published, sort_order
)
select
  'Mantenimiento y optimización FV',
  'mantenimiento-optimizacion-fv',
  'Guantánamo, Cuba',
  'Mantenimiento',
  'Revisión + limpieza + termografía',
  null,
  '—',
  'Sistema existente del cliente',
  '—',
  'Servicio de mantenimiento preventivo: inspección visual, limpieza de módulos, revisión de conexiones, registro térmico y recomendaciones de mejora de rendimiento.',
  '[
    {"label":"Alcance","value":"Preventivo + informe"},
    {"label":"Entregable","value":"Checklist + fotos"},
    {"label":"Frecuencia sugerida","value":"Semestral"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  'editorial',
  true,
  3
where not exists (
  select 1 from public.site_projects where slug = 'mantenimiento-optimizacion-fv'
);
