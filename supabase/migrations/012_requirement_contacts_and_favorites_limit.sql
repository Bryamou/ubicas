-- =========================================================
-- UBICAS - Migración 012: contacto por requerimiento + límite de favoritos
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 011_favorites_requirements.sql
-- (o 011_requirement_favorites.sql, según cómo la hayas nombrado).

-- ---------------------------------------------------------
-- Contacto por requerimiento: a diferencia del contacto de inmuebles, NO
-- inicia una conversación. Se guarda un mensaje de gancho comercial +
-- los datos de contacto de quien escribe (propietario, agente o cliente),
-- y queda asociado siempre a un requerimiento específico — así el cliente
-- puede diferenciar en su bandeja cuál de sus requerimientos generó cada
-- contacto. Requiere sesión iniciada (no se permite como invitado).
-- ---------------------------------------------------------
create table if not exists public.requirement_contacts (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  contacter_id uuid not null references public.profiles(id) on delete cascade,
  contacter_role user_role not null,
  pitch text not null,
  contact_name text not null,
  contact_phone text,
  contact_email text,
  status text not null default 'pending' check (status in ('pending', 'attended')),
  created_at timestamptz not null default now()
);

create index if not exists idx_requirement_contacts_requirement on public.requirement_contacts(requirement_id);
create index if not exists idx_requirement_contacts_contacter on public.requirement_contacts(contacter_id);

alter table public.requirement_contacts enable row level security;

-- El cliente dueño del requerimiento ve todos sus contactos; quien contactó
-- ve los suyos propios.
create policy "requirement_contacts_select" on public.requirement_contacts for select using (
  contacter_id = auth.uid()
  or exists (select 1 from public.requirements r where r.id = requirement_contacts.requirement_id and r.buyer_id = auth.uid())
);

create policy "requirement_contacts_insert" on public.requirement_contacts for insert with check (
  contacter_id = auth.uid()
);

create policy "requirement_contacts_update_owner" on public.requirement_contacts for update using (
  exists (select 1 from public.requirements r where r.id = requirement_contacts.requirement_id and r.buyer_id = auth.uid())
);

-- No permitir más de un contacto pendiente de la misma persona sobre el
-- mismo requerimiento (evita spam repetido).
create unique index if not exists uq_requirement_contact_pending
  on public.requirement_contacts(requirement_id, contacter_id)
  where status = 'pending';

-- Notifica al cliente cuando alguien contacta uno de sus requerimientos
create or replace function public.notify_new_requirement_contact()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_buyer_id uuid;
begin
  select buyer_id into v_buyer_id from public.requirements where id = new.requirement_id;

  insert into public.notifications (user_id, type, title, body, link_url)
  values (v_buyer_id, 'new_requirement_contact', 'Nuevo contacto sobre tu requerimiento',
          'Alguien está interesado en ayudarte con tu búsqueda.', '/panel/comprador/contactos');

  return new;
end;
$$;

drop trigger if exists trg_notify_new_requirement_contact on public.requirement_contacts;
create trigger trg_notify_new_requirement_contact
  after insert on public.requirement_contacts
  for each row execute function public.notify_new_requirement_contact();

-- ---------------------------------------------------------
-- Límite de 20 favoritos por tipo (inmuebles y requerimientos, cada uno
-- por separado) y por usuario.
-- ---------------------------------------------------------
create or replace function public.enforce_favorites_limit()
returns trigger language plpgsql as $$
declare
  v_count int;
begin
  if new.property_id is not null then
    select count(*) into v_count from public.favorites where user_id = new.user_id and property_id is not null;
    if v_count >= 20 then
      raise exception 'Ya alcanzaste el máximo de 20 inmuebles favoritos. Quita alguno para agregar otro.';
    end if;
  elsif new.requirement_id is not null then
    select count(*) into v_count from public.favorites where user_id = new.user_id and requirement_id is not null;
    if v_count >= 20 then
      raise exception 'Ya alcanzaste el máximo de 20 clientes favoritos. Quita alguno para agregar otro.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_favorites_limit on public.favorites;
create trigger trg_enforce_favorites_limit
  before insert on public.favorites
  for each row execute function public.enforce_favorites_limit();
