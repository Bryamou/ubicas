-- =========================================================
-- UBICAS - Migración 009: contactos con datos de invitado
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 008_price_history.sql.
--
-- Permite que el botón "Contactar" de la tarjeta de inmueble funcione
-- incluso sin sesión iniciada, guardando nombre/correo/teléfono digitados
-- en el formulario. Si la persona sí tiene sesión, se sigue guardando
-- también su requester_id como antes.

alter table public.contact_requests
  alter column requester_id drop not null,
  add column if not exists guest_name text,
  add column if not exists guest_email text,
  add column if not exists guest_phone text;

drop policy if exists "contact_requests_insert" on public.contact_requests;
create policy "contact_requests_insert" on public.contact_requests for insert with check (
  requester_id = auth.uid()
  or (requester_id is null and guest_email is not null)
);

-- La política de SELECT ya cubre bien ambos casos (el propietario/agente
-- del inmueble siempre puede ver sus contactos, sean de invitado o no).
