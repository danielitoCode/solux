-- Seed mínimo para desarrollo

insert into public.company_profile (name, tagline, about, mission, vision, years_of_experience, completed_projects)
values (
  'SOLUX',
  'Energía limpia para un mejor mañana.',
  'Diseñamos e instalamos soluciones solares y eléctricas en Guantánamo, Cuba.',
  'Llevar energía limpia y confiable a hogares y negocios.',
  'Ser el referente de ingeniería solar en la región.',
  5,
  120
);

insert into public.contact_info (email, phone, whatsapp, address, city, country)
values ('hola@solux.cu', '+53 5 XXX XXXX', '+53 5 XXX XXXX', 'Guantánamo', 'Guantánamo', 'Cuba');

insert into public.business_hours (day, open_time, close_time, is_closed) values
  ('monday', '08:00', '17:00', false),
  ('tuesday', '08:00', '17:00', false),
  ('wednesday', '08:00', '17:00', false),
  ('thursday', '08:00', '17:00', false),
  ('friday', '08:00', '17:00', false),
  ('saturday', null, null, true),
  ('sunday', null, null, true);

insert into public.catalog_items (type, category, name, short_description, description, price, currency, features, is_featured, sort_order) values
  ('product', 'solar_panels', 'Panel Monocristalino 550W', 'Alta eficiencia para residencial y comercial.', 'Módulo fotovoltaico monocristalino de 550W.', 180, 'USD', array['Eficiencia >21%','Garantía 25 años'], true, 1),
  ('product', 'inverters', 'Inversor Híbrido 5kW', 'Gestión inteligente de red + batería.', 'Inversor híbrido con monitoreo remoto.', 890, 'USD', array['MPPT dual','App de monitoreo'], true, 2),
  ('product', 'batteries', 'Batería LiFePO4 5kWh', 'Almacenamiento seguro y de larga vida.', 'Batería litio hierro fosfato.', 1200, 'USD', array['6000+ ciclos','BMS integrado'], false, 3),
  ('service', 'solar_kits', 'Kit solar residencial 3kW', 'Paquete completo listo para instalar.', 'Incluye paneles, inversor, estructura y cableado.', 2800, 'USD', array['Instalación incluida','Visita técnica'], true, 4),
  ('service', 'electrical_installation', 'Instalación eléctrica completa', 'Residencial, comercial e industrial.', 'Diseño, materiales e instalación según normas.', null, 'USD', array['Diseño certificado','Pruebas finales'], false, 5),
  ('service', 'maintenance', 'Mantenimiento preventivo', 'Revisión y limpieza de sistemas solares.', 'Diagnóstico, limpieza e informe.', 80, 'USD', array['Inspección térmica','Limpieza'], false, 6);
