-- =========================================================
-- UBICAS - Migración 008: precio original (para "bajaron de precio")
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 007_admin_module.sql.

alter table public.properties
  add column if not exists original_price numeric(12,2);

-- La primera vez que se publica un inmueble, se guarda su precio de
-- referencia. Si más adelante el propietario baja el precio, comparamos
-- contra este valor para mostrar "bajó de precio" y poder ordenar por ello.
create or replace function public.set_original_price()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.original_price is null then
    new.original_price := new.price;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_original_price on public.properties;
create trigger trg_set_original_price
  before insert or update on public.properties
  for each row execute function public.set_original_price();

-- Completa el precio original de inmuebles publicados antes de esta migración
update public.properties
  set original_price = price
  where status = 'published' and original_price is null;
