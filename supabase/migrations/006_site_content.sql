-- Contenido editable por vista pública.
create table if not exists public.site_content (
  page_slug text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Public read site_content" on public.site_content;
create policy "Public read site_content"
  on public.site_content for select
  using (true);

drop policy if exists "Admin manage site_content" on public.site_content;
create policy "Admin manage site_content"
  on public.site_content for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

insert into public.site_content (page_slug, content) values
('inicio', '{"eyebrow":"Lo que hacemos","title":"Energía limpia para un mejor mañana.","description":"Diseñamos e instalamos soluciones solares y eléctricas para hogares, negocios e industrias. Ingeniería cercana, tecnología y resultados medibles.","secondary_title":"Más que energía, construimos confianza.","secondary_description":"Cuéntanos qué necesitas y diseñamos el siguiente paso.","image_1":"https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1100&q=85"}'::jsonb),
('servicios', '{"eyebrow":"Servicios","title":"Todo lo necesario en un solo lugar.","description":"Soluciones integrales para producir, almacenar, convertir y distribuir energía con seguridad.","secondary_title":"Diseñado para tu realidad.","secondary_description":"No vendemos una solución estándar. Evaluamos consumo, espacio, respaldo y crecimiento antes de recomendar un sistema.","image_1":"https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85"}'::jsonb),
('proyectos', '{"eyebrow":"Proyectos","title":"Casos reales, resultados que iluminan.","description":"Cada proyecto cuenta una historia de eficiencia, confianza y compromiso con el medio ambiente.","secondary_title":"Vivienda familiar","secondary_description":"Guantánamo · Sistema fotovoltaico con respaldo","image_1":"https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1300&q=85","image_2":"https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=700&q=80","image_3":"https://images.unsplash.com/photo-1545208942-e1c9c8c6a6d1?auto=format&fit=crop&w=700&q=80","image_4":"https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=700&q=80"}'::jsonb),
('nosotros', '{"eyebrow":"Nosotros","title":"Ingeniería, experiencia y pasión por la energía.","description":"En SOLUX creemos en el poder de la energía limpia para transformar hogares y negocios. Combinamos criterio técnico, instalación profesional y atención cercana.","secondary_title":"Nuestros valores","secondary_description":"Hecho con criterio.","image_1":"https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85"}'::jsonb)
on conflict (page_slug) do nothing;
