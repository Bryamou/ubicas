-- =========================================================
-- UBICAS - Migración 007: panel de administración (Fase 5)
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 006_notifications.sql.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Los administradores pueden actualizar cualquier perfil (para verificar
-- agentes). El resto de columnas sensibles del perfil se siguen editando
-- solo por su dueño gracias a la política "profiles_update_own" ya existente.
create policy "profiles_update_admin" on public.profiles for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- ---------------------------------------------------------
-- Activa tu primera cuenta admin manualmente reemplazando el correo:
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
--
-- Desde ahí, esa cuenta ya puede entrar a /admin/agentes con sesión
-- iniciada (con cualquier rol: propietario, agente o comprador).
-- ---------------------------------------------------------
