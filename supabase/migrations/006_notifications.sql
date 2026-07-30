-- =========================================================
-- UBICAS - Migración 006: notificaciones automáticas (Fase 4)
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 005_buyer_module.sql.
--
-- Genera notificaciones in-app automáticamente cuando ocurren eventos
-- relevantes, en vez de depender de que cada pantalla del frontend
-- recuerde insertarlas. Todas las funciones son SECURITY DEFINER para
-- poder insertar en notifications sin toparse con RLS.

-- ---------------------------------------------------------
-- Nuevo contacto sobre un inmueble -> notifica al contacto principal
-- (agente asignado si existe, si no al propietario)
-- ---------------------------------------------------------
create or replace function public.notify_new_contact()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_property record;
  v_recipient uuid;
begin
  select owner_id, title into v_property from public.properties where id = new.property_id;

  select agent_id into v_recipient from public.property_agent_assignments where property_id = new.property_id;
  if v_recipient is null then
    v_recipient := v_property.owner_id;
  end if;

  insert into public.notifications (user_id, type, title, body, link_url)
  values (v_recipient, 'new_contact', 'Nuevo contacto', 'Alguien está interesado en "' || v_property.title || '"', '/inmuebles/' || new.property_id);

  return new;
end;
$$;

drop trigger if exists trg_notify_new_contact on public.contact_requests;
create trigger trg_notify_new_contact after insert on public.contact_requests
  for each row execute function public.notify_new_contact();

-- ---------------------------------------------------------
-- Nueva solicitud de visita -> notifica al contacto principal
-- ---------------------------------------------------------
create or replace function public.notify_new_visit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_property record;
  v_recipient uuid;
begin
  select owner_id, title into v_property from public.properties where id = new.property_id;

  select agent_id into v_recipient from public.property_agent_assignments where property_id = new.property_id;
  if v_recipient is null then
    v_recipient := v_property.owner_id;
  end if;

  insert into public.notifications (user_id, type, title, body, link_url)
  values (v_recipient, 'new_visit', 'Nueva solicitud de visita', 'Te pidieron una visita para "' || v_property.title || '"', '/inmuebles/' || new.property_id);

  return new;
end;
$$;

drop trigger if exists trg_notify_new_visit on public.visit_requests;
create trigger trg_notify_new_visit after insert on public.visit_requests
  for each row execute function public.notify_new_visit();

-- ---------------------------------------------------------
-- Cambio de estado de una visita -> notifica a quien la solicitó
-- ---------------------------------------------------------
create or replace function public.notify_visit_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_label text;
begin
  if new.status = old.status then
    return new;
  end if;

  select title into v_title from public.properties where id = new.property_id;
  v_label := case new.status
    when 'accepted' then 'aceptada'
    when 'rejected' then 'rechazada'
    when 'completed' then 'completada'
    else new.status
  end;

  insert into public.notifications (user_id, type, title, body, link_url)
  values (new.requester_id, 'visit_status', 'Visita ' || v_label, 'Tu visita a "' || v_title || '" fue ' || v_label, '/inmuebles/' || new.property_id);

  return new;
end;
$$;

drop trigger if exists trg_notify_visit_status on public.visit_requests;
create trigger trg_notify_visit_status after update on public.visit_requests
  for each row execute function public.notify_visit_status_change();

-- ---------------------------------------------------------
-- Nueva propuesta de agente a propietario -> notifica al propietario
-- ---------------------------------------------------------
create or replace function public.notify_new_agent_proposal()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  select title into v_title from public.properties where id = new.property_id;

  insert into public.notifications (user_id, type, title, body, link_url)
  values (new.owner_id, 'new_proposal', 'Nueva propuesta de agente', 'Un agente quiere representar "' || v_title || '"', '/panel/propietario/propuestas');

  return new;
end;
$$;

drop trigger if exists trg_notify_new_agent_proposal on public.agent_proposals;
create trigger trg_notify_new_agent_proposal after insert on public.agent_proposals
  for each row execute function public.notify_new_agent_proposal();

-- ---------------------------------------------------------
-- Propuesta de agente resuelta (rechazada; la aceptada ya se notifica
-- dentro de accept_agent_proposal) -> notifica al agente
-- ---------------------------------------------------------
create or replace function public.notify_agent_proposal_resolved()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  if new.status = old.status or new.status <> 'rejected' then
    return new;
  end if;

  select title into v_title from public.properties where id = new.property_id;

  insert into public.notifications (user_id, type, title, body, link_url)
  values (new.agent_id, 'proposal_rejected', 'Propuesta rechazada', 'Tu propuesta para "' || v_title || '" fue rechazada', '/panel/agente/propuestas');

  return new;
end;
$$;

drop trigger if exists trg_notify_agent_proposal_resolved on public.agent_proposals;
create trigger trg_notify_agent_proposal_resolved after update on public.agent_proposals
  for each row execute function public.notify_agent_proposal_resolved();

-- ---------------------------------------------------------
-- Nueva propuesta de agente a comprador (requerimiento) -> notifica al comprador
-- ---------------------------------------------------------
create or replace function public.notify_new_requirement_proposal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link_url)
  values (new.buyer_id, 'new_requirement_proposal', 'Nueva propuesta de agente', 'Un agente quiere ayudarte con tu búsqueda', '/panel/comprador/propuestas');

  return new;
end;
$$;

drop trigger if exists trg_notify_new_requirement_proposal on public.requirement_agent_proposals;
create trigger trg_notify_new_requirement_proposal after insert on public.requirement_agent_proposals
  for each row execute function public.notify_new_requirement_proposal();

-- ---------------------------------------------------------
-- Propuesta sobre requerimiento resuelta -> notifica al agente
-- ---------------------------------------------------------
create or replace function public.notify_requirement_proposal_resolved()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_label text;
begin
  if new.status = old.status or new.status = 'pending' then
    return new;
  end if;

  v_label := case new.status when 'accepted' then 'aceptada' else 'rechazada' end;

  insert into public.notifications (user_id, type, title, body, link_url)
  values (new.agent_id, 'requirement_proposal_resolved', 'Propuesta ' || v_label, 'Tu propuesta de servicio fue ' || v_label, '/panel/agente/propuestas');

  return new;
end;
$$;

drop trigger if exists trg_notify_requirement_proposal_resolved on public.requirement_agent_proposals;
create trigger trg_notify_requirement_proposal_resolved after update on public.requirement_agent_proposals
  for each row execute function public.notify_requirement_proposal_resolved();

-- ---------------------------------------------------------
-- Nuevo mensaje en una conversación -> notifica al otro participante
-- ---------------------------------------------------------
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_recipient uuid;
begin
  select case when participant_a = new.sender_id then participant_b else participant_a end
  into v_recipient
  from public.conversations where id = new.conversation_id;

  insert into public.notifications (user_id, type, title, body, link_url)
  values (v_recipient, 'new_message', 'Nuevo mensaje', 'Tienes un mensaje nuevo en Ubicas', '/mensajes?conversation=' || new.conversation_id);

  return new;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message after insert on public.messages
  for each row execute function public.notify_new_message();
