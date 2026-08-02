-- =========================================================
-- UBICAS - Migración 014: estados de seguimiento de contactos
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 013_commission_share_and_client_proposals.sql
--
-- Reemplaza el estado simple pending/attended de contact_requests por 6
-- estados de seguimiento que el propietario puede elegir manualmente:
-- atendido, en seguimiento, descartado, en visita, por concretar, cerrado.

-- Se agrega de forma defensiva por si la columna "status" no quedó
-- registrada en una migración anterior de esta tabla.
alter table public.contact_requests add column if not exists status text;

-- Importante: quitar la restricción vieja ANTES de tocar los datos,
-- para no chocar contra el check constraint anterior (pending/attended).
alter table public.contact_requests drop constraint if exists contact_requests_status_check;

update public.contact_requests
set status = 'following_up'
where status is null or status = 'pending';

alter table public.contact_requests alter column status set default 'following_up';
alter table public.contact_requests alter column status set not null;

alter table public.contact_requests
  add constraint contact_requests_status_check check (
    status in ('attended', 'following_up', 'discarded', 'visiting', 'closing', 'closed')
  );
