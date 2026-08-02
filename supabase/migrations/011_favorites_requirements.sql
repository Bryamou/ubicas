-- =========================================================
-- UBICAS - Migración 011: favoritos también para clientes (requerimientos)
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 010_requirements_marketplace.sql.
--
-- Hasta ahora `favorites` solo admitía inmuebles (property_id not null).
-- El botón de favorito de la tarjeta/ficha de "cliente" (requerimiento) ya
-- insertaba con requirement_id, lo que fallaba contra este esquema. Se
-- amplía la tabla para admitir exactamente uno de los dos: property_id o
-- requirement_id.

alter table public.favorites
  alter column property_id drop not null,
  add column if not exists requirement_id uuid references public.requirements(id) on delete cascade;

alter table public.favorites
  add constraint favorites_target_check check (
    (property_id is not null and requirement_id is null)
    or (property_id is null and requirement_id is not null)
  );

create unique index if not exists favorites_user_requirement_unique
  on public.favorites(user_id, requirement_id)
  where requirement_id is not null;

create index if not exists idx_favorites_requirement on public.favorites(requirement_id);