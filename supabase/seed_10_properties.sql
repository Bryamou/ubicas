-- =========================================================
-- UBICAS - Datos de demostración: 10 inmuebles con fotos
-- =========================================================
-- Carga 10 inmuebles publicados:
--   - 5 como "Propietario directo" (solo del dueño demo)
--   - 5 como "Agente verificado" (dueño demo + agente demo vinculado
--     mediante una propuesta aceptada, igual que en el flujo real)
-- Cada inmueble lleva 3 fotos genéricas (imágenes de stock públicas,
-- de https://picsum.photos, sin necesidad de subir nada a tu Storage).
--
-- REQUISITOS ANTES DE CORRER ESTE SCRIPT:
-- 1. Ya debes tener creadas las cuentas demo (ver sección de "Datos de
--    demostración" del README): propietario.demo@ubicas.pe y
--    agente.demo@ubicas.pe, como mínimo.
-- 2. Reemplaza OWNER_ID y AGENT_ID abajo por los UUID reales de esas
--    cuentas (Authentication > Users > copiar "UID" en Supabase).
-- 3. Ejecuta este script en el SQL Editor.

do $$
declare
  v_owner_id uuid := 'df397fe5-a19b-4417-b0ac-e6b760aee697';
  v_agent_id uuid := '899fe6d3-50f4-482f-a1c3-c34fd6799c47';

  -- 3 fotos genéricas reutilizadas para todos los inmuebles de demo
  img1 text := 'https://picsum.photos/id/1040/1200/800';
  img2 text := 'https://picsum.photos/id/1074/1200/800';
  img3 text := 'https://picsum.photos/id/106/1200/800';

  p1 uuid := gen_random_uuid();
  p2 uuid := gen_random_uuid();
  p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid();
  p5 uuid := gen_random_uuid();
  p6 uuid := gen_random_uuid();
  p7 uuid := gen_random_uuid();
  p8 uuid := gen_random_uuid();
  p9 uuid := gen_random_uuid();
  p10 uuid := gen_random_uuid();

  pid uuid;
begin
  -- Asegura que el agente demo quede verificado para las pruebas
  update public.profiles set
    agency_name = coalesce(agency_name, 'Agente Demo Inmobiliaria'),
    agent_verified = true
  where id = v_agent_id;

  -- ---------------------------------------------------------
  -- 5 inmuebles publicados directamente por el propietario
  -- ---------------------------------------------------------
  insert into public.properties (
    id, owner_id, operation, property_type, title, description, district, city, price, currency,
    area_m2, area_built_m2, bedrooms, bathrooms, parking_spots, age_years, floor_number, total_floors,
    pets_allowed, furnished, negotiable, highlights, contact_name, contact_phone, contact_email,
    contact_preference, contact_hours, status, published_at
  ) values
    (p1, v_owner_id, 'sale', 'apartment', 'Departamento moderno con vista al parque',
     'Amplio departamento de 3 dormitorios totalmente remodelado, con acabados de primera, cocina abierta y balcón con vista al parque. Excelente iluminación natural durante todo el día.',
     'Miraflores', 'Lima', 450000, 'PEN', 110, 100, 3, 2, 1, 5, 8, 15, true, false, true,
     'Vista al parque, remodelado 2024, balcón amplio',
     'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'Lunes a sábado, 9am - 7pm',
     'published', now() - interval '3 days'),

    (p2, v_owner_id, 'rent', 'house', 'Casa familiar con jardín en La Molina',
     'Casa de 2 pisos con jardín amplio, ideal para familias. Zona tranquila y segura, cerca a colegios y centros comerciales. Incluye cochera para 2 autos.',
     'La Molina', 'Lima', 4500, 'PEN', 220, 180, 4, 3, 2, 12, null, 2, true, true, false,
     'Jardín amplio, zona residencial, cerca a colegios',
     'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'call', 'Todos los días, 10am - 6pm',
     'published', now() - interval '10 days'),

    (p3, v_owner_id, 'sale', 'apartment', 'Departamento acogedor en San Isidro',
     'Departamento de 2 dormitorios en edificio con seguridad 24 horas, cerca al Bosque El Olivar. Cocina equipada y área de lavandería independiente.',
     'San Isidro', 'Lima', 570000, 'PEN', 85, 80, 2, 2, 1, 8, 4, 10, false, false, true,
     'Cerca al Bosque El Olivar, seguridad 24h',
     'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'email', 'Lunes a viernes, 9am - 6pm',
     'published', now() - interval '20 days'),

    (p4, v_owner_id, 'sale', 'office', 'Oficina corporativa en San Isidro financiero',
     'Oficina de 60m2 en edificio corporativo AAA, lista para operar. Incluye 2 estacionamientos y recepción compartida en el lobby del edificio.',
     'San Isidro', 'Lima', 280000, 'PEN', 60, 60, 0, 1, 2, 3, 12, 20, false, false, false,
     'Edificio AAA, lista para operar, 2 cocheras',
     'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'Lunes a viernes, 9am - 6pm',
     'published', now() - interval '5 days'),

    (p5, v_owner_id, 'rent', 'apartment', 'Departamento alquiler en Barranco',
     'Departamento de 1 dormitorio a pasos del malecón, ideal para una persona o pareja. Edificio bohemio con terraza compartida y excelente ubicación.',
     'Barranco', 'Lima', 2800, 'PEN', 55, 50, 1, 1, 0, 15, 2, 4, true, true, true,
     'A pasos del malecón, terraza compartida',
     'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'Todos los días, 8am - 8pm',
     'published', now() - interval '1 days');

  -- ---------------------------------------------------------
  -- 5 inmuebles gestionados por el agente (propuesta aceptada,
  -- el agente queda como primer contacto público)
  -- ---------------------------------------------------------
  insert into public.properties (
    id, owner_id, operation, property_type, title, description, district, city, price, currency,
    area_m2, area_built_m2, bedrooms, bathrooms, parking_spots, age_years, floor_number, total_floors,
    pets_allowed, furnished, negotiable, highlights, contact_name, contact_phone, contact_email,
    contact_preference, contact_hours, status, published_at
  ) values
    (p6, v_owner_id, 'sale', 'house', 'Casa moderna en Surco',
     'Casa de diseño moderno con 4 dormitorios, doble altura en la sala y terraza en el segundo piso. Urbanización cerrada con seguridad las 24 horas.',
     'Surco', 'Lima', 580000, 'PEN', 200, 190, 4, 3, 2, 4, null, 2, true, false, true,
     'Urbanización cerrada, doble altura, terraza',
     'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'Lunes a sábado, 9am - 7pm',
     'published', now() - interval '7 days'),

    (p7, v_owner_id, 'rent', 'apartment', 'Departamento amoblado en San Borja',
     'Departamento de 2 dormitorios totalmente amoblado, listo para mudarse. Cerca al Centro Comercial San Borja Plaza y a Javier Prado.',
     'San Borja', 'Lima', 3200, 'PEN', 90, 85, 2, 2, 1, 6, 6, 12, false, true, false,
     'Totalmente amoblado, listo para mudarse',
     'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'Todos los días, 9am - 8pm',
     'published', now() - interval '2 days'),

    (p8, v_owner_id, 'sale', 'commercial', 'Local comercial en Lince',
     'Local comercial de 80m2 en avenida principal con alto flujo peatonal, ideal para restaurante, tienda o servicio. Cuenta con baño y depósito.',
     'Lince', 'Lima', 350000, 'PEN', 80, 80, 0, 1, 0, 18, 1, 3, false, false, true,
     'Alto flujo peatonal, avenida principal',
     'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'call', 'Lunes a viernes, 10am - 6pm',
     'published', now() - interval '14 days'),

    (p9, v_owner_id, 'rent', 'apartment', 'Departamento con vista en Jesús María',
     'Departamento de 1 dormitorio con vista despejada, en edificio con ascensor y área de parrillas. Cerca al Campo de Marte.',
     'Jesús María', 'Lima', 2200, 'PEN', 60, 55, 1, 1, 1, 10, 9, 14, true, false, true,
     'Vista despejada, cerca al Campo de Marte',
     'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'Lunes a sábado, 10am - 7pm',
     'published', now() - interval '4 days'),

    (p10, v_owner_id, 'sale', 'house', 'Casa con vista al mar en Chorrillos',
     'Casa de 3 dormitorios a pocas cuadras del malecón de Chorrillos, con azotea propia y vista parcial al mar. Ideal como primera vivienda o inversión.',
     'Chorrillos', 'Lima', 410000, 'PEN', 150, 140, 3, 2, 1, 9, null, 3, true, false, true,
     'Vista parcial al mar, azotea propia',
     'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'email', 'Todos los días, 9am - 6pm',
     'published', now() - interval '25 days');

  -- Vincula al agente demo con los 5 inmuebles anteriores (p6-p10),
  -- simulando propuestas ya aceptadas por el propietario.
  foreach pid in array array[p6, p7, p8, p9, p10]
  loop
    insert into public.agent_proposals (property_id, agent_id, owner_id, pitch, commission_percent, commission_amount, status, resolved_at)
    select
      pid, v_agent_id, v_owner_id,
      'Hola, me gustaría representar tu inmueble. Tengo cartera de clientes activos en esta zona.',
      case when p.operation = 'sale' then 3.5 else null end,
      case when p.operation = 'rent' then p.price * 0.5 else null end,
      'accepted', now()
    from public.properties p where p.id = pid;

    insert into public.property_agent_assignments (property_id, agent_id, proposal_id)
    select pid, v_agent_id, ap.id
    from public.agent_proposals ap
    where ap.property_id = pid and ap.agent_id = v_agent_id
    order by ap.created_at desc limit 1;
  end loop;

  -- ---------------------------------------------------------
  -- Amenidades (property_features) para cada inmueble
  -- ---------------------------------------------------------
  insert into public.property_features (property_id, feature)
  values
    (p1, 'Balcón'), (p1, 'Ascensor'), (p1, 'Seguridad'),
    (p2, 'Jardín'), (p2, 'Áreas verdes'),
    (p3, 'Seguridad'), (p3, 'Ascensor'),
    (p4, 'Ascensor'), (p4, 'Seguridad'), (p4, 'Depósito'),
    (p5, 'Terraza'), (p5, 'Ascensor'),
    (p6, 'Piscina'), (p6, 'Seguridad'), (p6, 'Áreas verdes'),
    (p7, 'Gimnasio'), (p7, 'Ascensor'), (p7, 'Seguridad'),
    (p8, 'Depósito'),
    (p9, 'Ascensor'), (p9, 'Terraza'),
    (p10, 'Terraza'), (p10, 'Depósito');

  -- ---------------------------------------------------------
  -- 3 fotos genéricas por inmueble (10 x 3 = 30 filas)
  -- ---------------------------------------------------------
  insert into public.property_images (property_id, storage_path, sort_order, is_primary)
  select p.id, photos.img, photos.ord - 1, photos.ord = 1
  from (values (p1),(p2),(p3),(p4),(p5),(p6),(p7),(p8),(p9),(p10)) as props(id)
  join public.properties p on p.id = props.id,
  lateral (values (img1, 1), (img2, 2), (img3, 3)) as photos(img, ord);

end $$;

-- ---------------------------------------------------------
-- Limpieza (opcional): si quieres borrar estos 10 inmuebles de demo
-- para volver a cargarlos desde cero, corre esto antes de repetir el
-- script (borra en cascada imágenes, features, propuestas y vínculos):
--
--   delete from public.properties
--   where contact_email in ('carlos.demo@ubicas.pe', 'ana.demo@ubicas.pe');
-- ---------------------------------------------------------
