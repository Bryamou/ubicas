-- =========================================================
-- UBICAS - Datos de demostración
-- =========================================================
-- IMPORTANTE: las filas de auth.users NO se pueden insertar por SQL
-- directamente de forma soportada. Primero crea estos 3 usuarios de
-- demo desde la propia app (pantalla de registro) o desde el panel
-- Authentication > Users de Supabase, usando estos correos:
--
--   propietario.demo@ubicas.pe   (rol: owner)
--   agente.demo@ubicas.pe        (rol: agent)
--   comprador.demo@ubicas.pe     (rol: buyer)
--
-- El trigger handle_new_user creará su fila en public.profiles
-- automáticamente. Luego reemplaza los UUID de abajo por los reales
-- (Authentication > Users > copiar "UID") y ejecuta este script.

-- Reemplaza estos valores antes de ejecutar:
-- OWNER_ID    -> uuid del propietario demo
-- AGENT_ID    -> uuid del agente demo
-- BUYER_ID    -> uuid del comprador demo

do $$
declare
  owner_id uuid := 'OWNER_ID';
  agent_id uuid := 'AGENT_ID';
  buyer_id uuid := 'BUYER_ID';
  prop1 uuid := gen_random_uuid();
  prop2 uuid := gen_random_uuid();
  prop3 uuid := gen_random_uuid();
begin
  update public.profiles set
    agency_name = 'Agente Demo Inmobiliaria',
    agent_description = 'Más de 8 años ayudando a familias a encontrar su próximo hogar en Lima.',
    agent_zones = array['Miraflores', 'San Isidro', 'Surco'],
    agent_verified = true
  where id = agent_id;

  insert into public.properties (id, owner_id, operation, property_type, title, description, district, city, price, area_m2, bedrooms, bathrooms, parking_spots, status, published_at)
  values
    (prop1, owner_id, 'sale', 'apartment', 'Departamento moderno con vista al parque', 'Amplio departamento de 3 dormitorios, remodelado, con acabados de primera y balcón.', 'Miraflores', 'Lima', 285000, 110, 3, 2, 1, 'published', now()),
    (prop2, owner_id, 'rent', 'house', 'Casa familiar con jardín en San Borja', 'Casa de 2 pisos, jardín amplio, ideal para familias, cerca a colegios.', 'San Borja', 'Lima', 3200, 180, 4, 3, 2, 'published', now()),
    (prop3, owner_id, 'sale', 'office', 'Oficina corporativa en San Isidro financiero', 'Oficina de 60m2 en edificio corporativo, lista para operar.', 'San Isidro', 'Lima', 190000, 60, 0, 1, 1, 'published', now());

  insert into public.property_features (property_id, feature) values
    (prop1, 'Balcón'), (prop1, 'Ascensor'), (prop1, 'Seguridad 24h'),
    (prop2, 'Jardín'), (prop2, 'Cochera doble'), (prop2, 'Zona de parrilla'),
    (prop3, 'Aire acondicionado'), (prop3, 'Recepción compartida');

  insert into public.requirements (buyer_id, operation, property_type, district, max_budget, bedrooms, bathrooms, parking, pets, extra_notes)
  values (buyer_id, 'rent', 'apartment', 'Barranco', 2500, 2, 1, true, true, 'Busco algo cerca al malecón, acepto semi-amoblado.');

  insert into public.agent_proposals (property_id, agent_id, owner_id, pitch, commission_percent)
  values (prop1, agent_id, owner_id, 'Hola, me gustaría representar tu departamento. Tengo cartera de compradores activos en Miraflores.', 3.5);
end $$;
