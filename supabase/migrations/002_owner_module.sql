-- =========================================================
-- UBICAS - Migración 002: módulo propietario (Fase 0 + Fase 1)
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de supabase/schema.sql.
-- Es seguro volver a correr los bloques "if not exists" si algo falla a medias.

-- ---------------------------------------------------------
-- Nuevos estados de publicación (HU-03)
-- ---------------------------------------------------------
-- No se puede usar ALTER TYPE ... ADD VALUE dentro de una transacción
-- junto con su uso inmediato, así que van en sentencias sueltas.
alter type property_status add value if not exists 'sold';
alter type property_status add value if not exists 'rented';

-- ---------------------------------------------------------
-- Nuevos campos en properties (pasos 1, 2 y 5 del wizard)
-- ---------------------------------------------------------
alter table public.properties
  add column if not exists hide_exact_address boolean not null default false,
  add column if not exists negotiable boolean not null default false,
  add column if not exists area_built_m2 numeric(8,2),
  add column if not exists age_years int,
  add column if not exists floor_number int,
  add column if not exists total_floors int,
  add column if not exists pets_allowed boolean,
  add column if not exists furnished boolean,
  add column if not exists highlights text,
  add column if not exists terms text,
  add column if not exists additional_info text,
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists contact_preference text check (contact_preference in ('call', 'whatsapp', 'email')),
  add column if not exists contact_hours text;

-- ---------------------------------------------------------
-- Foto principal explícita (property_images)
-- ---------------------------------------------------------
alter table public.property_images
  add column if not exists is_primary boolean not null default false;

-- ---------------------------------------------------------
-- Estado de atención en contact_requests (HU-06)
-- ---------------------------------------------------------
alter table public.contact_requests
  add column if not exists status text not null default 'pending' check (status in ('pending', 'attended'));

-- ---------------------------------------------------------
-- Vistas únicas por visitante (HU-05): índice para deduplicar
-- por sesión/usuario a nivel de aplicación (no se fuerza unicidad
-- en DB porque los visitantes anónimos no tienen un id estable).
-- ---------------------------------------------------------
create index if not exists idx_property_views_property_viewer
  on public.property_views(property_id, viewer_id);

-- ---------------------------------------------------------
-- Storage: bucket "property-images"
-- ---------------------------------------------------------
-- 1. Antes de correr esta sección, crea el bucket manualmente en
--    Storage > New bucket > nombre exacto "property-images" > Public bucket: ON.
-- 2. Convención de ruta de archivo: {user_id}/{property_id}/{filename}
--    (el primer segmento de la ruta DEBE ser el uid del propietario).

create policy "property_images_public_read"
  on storage.objects for select
  using (bucket_id = 'property-images');

create policy "property_images_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "property_images_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
