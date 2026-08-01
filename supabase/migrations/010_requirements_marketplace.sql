-- =========================================================
-- UBICAS - Migración 010: marketplace de clientes (requerimientos)
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 009_guest_contacts.sql.

-- Nuevo tipo de inmueble usado solo por requerimientos (por ahora)
alter type property_type add value if not exists 'project';

-- Nuevos campos del requerimiento
alter table public.requirements
  add column if not exists min_area_m2 numeric(8,2),
  add column if not exists description text,
  add column if not exists urgency text check (
    urgency in ('asap', 'within_30_days', '1_3_months', 'more_than_3_months', 'flexible')
  ),
  add column if not exists expiry_date timestamptz,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- ---------------------------------------------------------
-- Expiración automática: en vez de depender de un cron job (no
-- disponible sin extensiones adicionales), calculamos la fecha de
-- vencimiento al momento de publicar, según la urgencia elegida, y
-- filtramos por ella en las consultas del listado público.
-- ---------------------------------------------------------
create or replace function public.set_requirement_expiry()
returns trigger language plpgsql as $$
begin
  if new.urgency is not null then
    new.expiry_date := coalesce(new.created_at, now()) + (
      case new.urgency
        when 'asap' then interval '14 days'
        when 'within_30_days' then interval '30 days'
        when '1_3_months' then interval '90 days'
        when 'more_than_3_months' then interval '180 days'
        else interval '365 days' -- flexible
      end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_requirement_expiry on public.requirements;
create trigger trg_set_requirement_expiry
  before insert or update on public.requirements
  for each row execute function public.set_requirement_expiry();

-- Completa expiry_date de requerimientos ya existentes que no tengan urgencia
update public.requirements
set urgency = 'flexible'
where urgency is null and status = 'active';
