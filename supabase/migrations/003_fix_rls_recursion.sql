-- =========================================================
-- UBICAS - Migración 003: corrige recursión infinita en RLS
-- =========================================================
-- Causa: la política de SELECT de "properties" consultaba
-- "property_agent_assignments", cuya propia política de SELECT
-- volvía a consultar "properties" -> bucle infinito (42P17).
--
-- Solución: una función SECURITY DEFINER que consulta
-- property_agent_assignments sin pasar de nuevo por sus políticas
-- RLS, rompiendo el ciclo.
--
-- Ejecutar en el SQL Editor de Supabase después de 002_owner_module.sql.

create or replace function public.is_assigned_agent(p_property_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.property_agent_assignments a
    where a.property_id = p_property_id and a.agent_id = auth.uid()
  );
$$;

drop policy if exists "properties_select_published_or_own" on public.properties;

create policy "properties_select_published_or_own" on public.properties for select using (
  status = 'published'
  or owner_id = auth.uid()
  or public.is_assigned_agent(properties.id)
);
