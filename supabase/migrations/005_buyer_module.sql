-- =========================================================
-- UBICAS - Migración 005: módulo comprador/arrendatario (Fase 3)
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 004_agent_module.sql.

create unique index if not exists uq_requirement_proposal_pending
  on public.requirement_agent_proposals(requirement_id, agent_id)
  where status = 'pending';
