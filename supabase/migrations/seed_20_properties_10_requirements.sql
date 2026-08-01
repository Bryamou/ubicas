-- =========================================================
-- UBICAS - Datos de demostración: 20 inmuebles + 10 clientes
-- =========================================================
-- Carga:
--   - 10 inmuebles publicados directo por el PROPIETARIO
--   - 10 inmuebles gestionados por el AGENTE (propuesta ya aceptada,
--     el agente queda como primer contacto público)
--   - 10 requerimientos publicados por el CLIENTE
-- Cada inmueble lleva 3 fotos temáticas de inmuebles reales (de
-- loremflickr.com, gratis, sin necesidad de subir nada a tu Storage).
--
-- REQUISITO: las 3 cuentas ya deben existir (créalas desde /register,
-- con "Confirm email" desactivado en Supabase mientras pruebas):
--   Propietario: bryamo.u+propietario@gmail.com  (rol: Propietario)
--   Agente:      bryamo.u+agente@gmail.com        (rol: Agente inmobiliario)
--   Cliente:     bryamo.u+cliente@gmail.com        (rol: Comprador/Arrendatario)
--
-- No necesitas copiar ningún UUID: el script las busca por correo solo.
-- Ejecuta esto completo en el SQL Editor de Supabase.

do $$
declare
  v_owner_id uuid := (select id from auth.users where email = 'bryamo.u+propietario@gmail.com');
  v_agent_id uuid := (select id from auth.users where email = 'bryamo.u+agente@gmail.com');
  v_buyer_id uuid := (select id from auth.users where email = 'bryamo.u+cliente@gmail.com');

  -- 2 sets de 3 fotos temáticas de inmuebles (loremflickr, sin API key)
  img_a1 text := 'https://loremflickr.com/1200/800/house,exterior';
  img_a2 text := 'https://loremflickr.com/1200/800/livingroom,modern';
  img_a3 text := 'https://loremflickr.com/1200/800/kitchen,house';
  img_b1 text := 'https://loremflickr.com/1200/800/apartment,building';
  img_b2 text := 'https://loremflickr.com/1200/800/bedroom,interior';
  img_b3 text := 'https://loremflickr.com/1200/800/realestate,property';

  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid(); p5 uuid := gen_random_uuid(); p6 uuid := gen_random_uuid();
  p7 uuid := gen_random_uuid(); p8 uuid := gen_random_uuid(); p9 uuid := gen_random_uuid();
  p10 uuid := gen_random_uuid(); p11 uuid := gen_random_uuid(); p12 uuid := gen_random_uuid();
  p13 uuid := gen_random_uuid(); p14 uuid := gen_random_uuid(); p15 uuid := gen_random_uuid();
  p16 uuid := gen_random_uuid(); p17 uuid := gen_random_uuid(); p18 uuid := gen_random_uuid();
  p19 uuid := gen_random_uuid(); p20 uuid := gen_random_uuid();

  pid uuid;
  idx int := 0;
begin
  if v_owner_id is null then
    raise exception 'No existe ninguna cuenta con el correo bryamo.u+propietario@gmail.com. Créala primero desde /register con rol Propietario.';
  end if;
  if v_agent_id is null then
    raise exception 'No existe ninguna cuenta con el correo bryamo.u+agente@gmail.com. Créala primero desde /register con rol Agente inmobiliario.';
  end if;
  if v_buyer_id is null then
    raise exception 'No existe ninguna cuenta con el correo bryamo.u+cliente@gmail.com. Créala primero desde /register con rol Comprador/Arrendatario.';
  end if;

  update public.profiles set agency_name = coalesce(agency_name, 'Agente Demo Inmobiliaria'), agent_verified = true
  where id = v_agent_id;

  -- ---------------------------------------------------------
  -- 10 inmuebles publicados directamente por el propietario
  -- ---------------------------------------------------------
  insert into public.properties (
    id, owner_id, operation, property_type, title, description, district, city, price, currency,
    area_m2, area_built_m2, bedrooms, bathrooms, parking_spots, age_years, floor_number,
    pets_allowed, furnished, negotiable, highlights, contact_name, contact_phone, contact_email,
    contact_preference, status, published_at
  ) values
    (p1, v_owner_id, 'sale', 'apartment', 'Departamento moderno con vista al parque', 'Amplio departamento de 3 dormitorios remodelado, cocina abierta y balcón con vista al parque.', 'Miraflores', 'Lima', 450000, 'PEN', 110, 100, 3, 2, 1, 5, 8, true, false, true, 'Vista al parque, remodelado', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '2 days'),
    (p2, v_owner_id, 'sale', 'apartment', 'Departamento acogedor en San Isidro', 'Departamento de 2 dormitorios cerca al Bosque El Olivar, seguridad 24h.', 'San Isidro', 'Lima', 570000, 'PEN', 85, 80, 2, 2, 1, 8, 4, false, false, true, 'Cerca al Bosque El Olivar', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'email', 'published', now() - interval '15 days'),
    (p3, v_owner_id, 'rent', 'house', 'Casa familiar con jardín en La Molina', 'Casa de 2 pisos con jardín amplio, ideal para familias, zona tranquila.', 'La Molina', 'Lima', 4500, 'PEN', 220, 180, 4, 3, 2, 12, null, true, true, false, 'Jardín amplio, zona residencial', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'call', 'published', now() - interval '7 days'),
    (p4, v_owner_id, 'rent', 'apartment', 'Departamento alquiler en Barranco', 'Departamento de 1 dormitorio a pasos del malecón, edificio bohemio.', 'Barranco', 'Lima', 2800, 'PEN', 55, 50, 1, 1, 0, 15, 2, true, true, true, 'A pasos del malecón', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '1 days'),
    (p5, v_owner_id, 'sale', 'house', 'Casa moderna en Surco', 'Casa de diseño moderno con 4 dormitorios y terraza en el segundo piso.', 'Surco', 'Lima', 580000, 'PEN', 200, 190, 4, 3, 2, 4, null, true, false, true, 'Urbanización cerrada, terraza', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '9 days'),
    (p6, v_owner_id, 'rent', 'apartment', 'Departamento amoblado en San Borja', 'Departamento de 2 dormitorios totalmente amoblado, listo para mudarse.', 'San Borja', 'Lima', 3200, 'PEN', 90, 85, 2, 2, 1, 6, 6, false, true, false, 'Totalmente amoblado', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '3 days'),
    (p7, v_owner_id, 'sale', 'apartment', 'Departamento con vista en Jesús María', 'Departamento de 1 dormitorio con vista despejada, cerca al Campo de Marte.', 'Jesús María', 'Lima', 320000, 'PEN', 60, 55, 1, 1, 1, 10, 9, true, false, true, 'Vista despejada, cerca al Campo de Marte', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'email', 'published', now() - interval '20 days'),
    (p8, v_owner_id, 'sale', 'house', 'Casa con vista al mar en Chorrillos', 'Casa de 3 dormitorios a pocas cuadras del malecón, azotea propia.', 'Chorrillos', 'Lima', 410000, 'PEN', 150, 140, 3, 2, 1, 9, null, true, false, true, 'Vista parcial al mar, azotea propia', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '4 days'),
    (p9, v_owner_id, 'sale', 'office', 'Oficina corporativa en Lince', 'Oficina de 55m2 en edificio con seguridad, lista para operar.', 'Lince', 'Lima', 260000, 'PEN', 55, 55, 0, 1, 1, 6, 5, false, false, false, 'Lista para operar', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'call', 'published', now() - interval '11 days'),
    (p10, v_owner_id, 'rent', 'apartment', 'Departamento en Magdalena del Mar', 'Departamento de 2 dormitorios cerca a la Costa Verde.', 'Magdalena del Mar', 'Lima', 2400, 'PEN', 70, 65, 2, 1, 1, 14, 3, true, false, true, 'Cerca a la Costa Verde', 'Carlos Ramírez', '+51 987 654 321', 'carlos.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '6 days');

  -- ---------------------------------------------------------
  -- 10 inmuebles gestionados por el agente (propuesta aceptada)
  -- ---------------------------------------------------------
  insert into public.properties (
    id, owner_id, operation, property_type, title, description, district, city, price, currency,
    area_m2, area_built_m2, bedrooms, bathrooms, parking_spots, age_years, floor_number,
    pets_allowed, furnished, negotiable, highlights, contact_name, contact_phone, contact_email,
    contact_preference, status, published_at
  ) values
    (p11, v_owner_id, 'sale', 'office', 'Oficina en San Isidro financiero', 'Oficina de 70m2 en edificio corporativo AAA, 2 estacionamientos.', 'San Isidro', 'Lima', 310000, 'PEN', 70, 70, 0, 1, 2, 3, 12, false, false, false, 'Edificio AAA', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '5 days'),
    (p12, v_owner_id, 'rent', 'apartment', 'Departamento en Miraflores a pasos del malecón', 'Departamento de 2 dormitorios totalmente equipado.', 'Miraflores', 'Lima', 3800, 'PEN', 95, 90, 2, 2, 1, 7, 10, false, true, false, 'A pasos del malecón', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '2 days'),
    (p13, v_owner_id, 'sale', 'house', 'Casa exclusiva en Surco', 'Casa de 5 dormitorios en condominio cerrado con áreas comunes.', 'Surco', 'Lima', 720000, 'PEN', 260, 240, 5, 4, 3, 2, null, true, false, true, 'Condominio cerrado, áreas comunes', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'call', 'published', now() - interval '13 days'),
    (p14, v_owner_id, 'sale', 'apartment', 'Departamento nuevo en San Borja', 'Departamento a estrenar de 3 dormitorios, entrega inmediata.', 'San Borja', 'Lima', 490000, 'PEN', 105, 100, 3, 2, 1, 0, 5, false, false, true, 'A estrenar, entrega inmediata', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '1 days'),
    (p15, v_owner_id, 'rent', 'apartment', 'Departamento en Barranco zona bohemia', 'Departamento de 1 dormitorio, terraza compartida, muy luminoso.', 'Barranco', 'Lima', 2600, 'PEN', 50, 48, 1, 1, 0, 18, 3, true, true, true, 'Terraza compartida, muy luminoso', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '8 days'),
    (p16, v_owner_id, 'rent', 'house', 'Casa en La Molina con piscina', 'Casa de 4 dormitorios con piscina propia y jardín.', 'La Molina', 'Lima', 6500, 'PEN', 300, 250, 4, 4, 2, 10, null, true, false, false, 'Piscina propia, jardín', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'call', 'published', now() - interval '17 days'),
    (p17, v_owner_id, 'sale', 'apartment', 'Departamento en Pueblo Libre', 'Departamento de 2 dormitorios cerca a museos y parques.', 'Pueblo Libre', 'Lima', 340000, 'PEN', 75, 70, 2, 1, 1, 9, 6, false, false, true, 'Cerca a museos y parques', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'email', 'published', now() - interval '4 days'),
    (p18, v_owner_id, 'rent', 'apartment', 'Departamento en San Miguel', 'Departamento de 1 dormitorio, cerca a la Costa Verde y universidades.', 'San Miguel', 'Lima', 1900, 'PEN', 48, 45, 1, 1, 0, 11, 4, true, false, true, 'Cerca a universidades', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '3 days'),
    (p19, v_owner_id, 'rent', 'house', 'Casa en Chorrillos cerca a playas', 'Casa de 3 dormitorios a 10 minutos de las playas del sur.', 'Chorrillos', 'Lima', 3900, 'PEN', 160, 150, 3, 2, 1, 13, null, true, false, false, 'Cerca a playas del sur', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'call', 'published', now() - interval '10 days'),
    (p20, v_owner_id, 'sale', 'commercial', 'Local comercial en Jesús María', 'Local de 90m2 en avenida principal, alto flujo peatonal.', 'Jesús María', 'Lima', 380000, 'PEN', 90, 90, 0, 1, 0, 16, 1, false, false, true, 'Alto flujo peatonal', 'Ana Torres', '+51 976 543 210', 'ana.demo@ubicas.pe', 'whatsapp', 'published', now() - interval '6 days');

  -- Vincula al agente con los 10 inmuebles del segundo bloque (p11-p20)
  foreach pid in array array[p11,p12,p13,p14,p15,p16,p17,p18,p19,p20]
  loop
    insert into public.agent_proposals (property_id, agent_id, owner_id, pitch, commission_percent, commission_amount, status, resolved_at)
    select pid, v_agent_id, v_owner_id,
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
  -- Amenidades para todos los inmuebles (variadas)
  -- ---------------------------------------------------------
  insert into public.property_features (property_id, feature)
  values
    (p1,'Balcón'), (p1,'Ascensor'), (p2,'Seguridad'), (p2,'Ascensor'),
    (p3,'Jardín'), (p3,'Áreas verdes'), (p4,'Terraza'), (p5,'Piscina'), (p5,'Seguridad'),
    (p6,'Gimnasio'), (p6,'Ascensor'), (p7,'Ascensor'), (p8,'Terraza'),
    (p9,'Ascensor'), (p9,'Seguridad'), (p10,'Balcón'),
    (p11,'Ascensor'), (p11,'Seguridad'), (p12,'Balcón'), (p13,'Piscina'), (p13,'Jardín'),
    (p14,'Ascensor'), (p14,'Gimnasio'), (p15,'Terraza'), (p16,'Piscina'), (p16,'Jardín'),
    (p17,'Ascensor'), (p18,'Ascensor'), (p19,'Jardín'), (p20,'Depósito');

  -- ---------------------------------------------------------
  -- 3 fotos temáticas por inmueble (20 x 3 = 60 filas), alternando
  -- entre los 2 sets para variedad visual
  -- ---------------------------------------------------------
  foreach pid in array array[p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20]
  loop
    idx := idx + 1;
    if idx % 2 = 1 then
      insert into public.property_images (property_id, storage_path, sort_order, is_primary) values
        (pid, img_a1, 0, true), (pid, img_a2, 1, false), (pid, img_a3, 2, false);
    else
      insert into public.property_images (property_id, storage_path, sort_order, is_primary) values
        (pid, img_b1, 0, true), (pid, img_b2, 1, false), (pid, img_b3, 2, false);
    end if;
  end loop;

  -- ---------------------------------------------------------
  -- 10 requerimientos publicados por el cliente
  -- ---------------------------------------------------------
  insert into public.requirements (
    buyer_id, operation, property_type, district, max_budget, bedrooms, bathrooms, parking, pets,
    min_area_m2, extra_notes, description, urgency, status
  ) values
    (v_buyer_id, 'rent', 'apartment', 'Miraflores', 3000, 2, 1, true, true, 60, 'Piso alto, con ascensor', 'Busco departamento cerca al malecón, semi-amoblado, para mudarme pronto.', 'asap', 'active'),
    (v_buyer_id, 'sale', 'house', 'La Molina', 650000, 4, 3, true, true, 200, 'Con jardín', 'Busco casa familiar en zona residencial tranquila, cerca a colegios.', 'flexible', 'active'),
    (v_buyer_id, 'rent', 'apartment', 'San Isidro', 3500, 2, 2, true, false, 80, 'Seguridad 24h', 'Departamento moderno cerca a oficinas del distrito financiero.', 'within_30_days', 'active'),
    (v_buyer_id, 'sale', 'apartment', 'Surco', 480000, 3, 2, true, false, 100, null, 'Departamento nuevo o seminuevo, listo para mudarse.', '1_3_months', 'active'),
    (v_buyer_id, 'rent', 'house', 'Barranco', 4500, 3, 2, false, true, 140, 'Acepto sin cochera', 'Casa con espacio para trabajar desde casa, zona bohemia.', 'asap', 'active'),
    (v_buyer_id, 'sale', 'office', 'San Borja', 300000, null, 1, true, false, 50, null, 'Oficina pequeña para consultorio o estudio profesional.', 'more_than_3_months', 'active'),
    (v_buyer_id, 'rent', 'apartment', 'Jesús María', 2200, 1, 1, false, false, 45, null, 'Departamento para una persona, cerca al Campo de Marte.', 'within_30_days', 'active'),
    (v_buyer_id, 'sale', 'land', 'Chorrillos', 250000, null, null, false, false, 150, null, 'Terreno para construir vivienda unifamiliar.', 'flexible', 'active'),
    (v_buyer_id, 'rent', 'commercial', 'Lince', 3200, null, 1, false, false, 70, null, 'Local para negocio de comida rápida, con buen flujo peatonal.', '1_3_months', 'active'),
    (v_buyer_id, 'sale', 'apartment', 'San Miguel', 300000, 2, 1, true, true, 65, 'Cerca a universidades', 'Departamento para inversión o vivienda propia, zona universitaria.', 'asap', 'active');

end $$;
