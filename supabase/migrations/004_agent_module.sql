-- =========================================================
-- UBICAS - Migración 004: módulo agente (Fase 2)
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 003_fix_rls_recursion.sql.

-- ---------------------------------------------------------
-- Storage: bucket "avatars" para fotos de perfil (propietarios y agentes)
-- ---------------------------------------------------------
-- 1. Antes de correr esta sección, crea el bucket manualmente en
--    Storage > New bucket > nombre exacto "avatars" > Public bucket: ON.
-- 2. Convención de ruta: {user_id}/{filename}

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------
-- agent_proposals: permitir que cualquier agente vea inmuebles
-- publicados para poder proponerse (ya cubierto por la política
-- properties_select_published_or_own), y evitar propuestas
-- duplicadas del mismo agente sobre el mismo inmueble mientras
-- esté pendiente.
-- ---------------------------------------------------------
create unique index if not exists uq_agent_proposal_pending
  on public.agent_proposals(property_id, agent_id)
  where status = 'pending';
