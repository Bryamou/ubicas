-- =========================================================
-- UBICAS - Migración 013: comisión compartida + propuestas a clientes con inmuebles
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase después de 012_requirement_contacts_and_favorites_limit.sql

-- ---------------------------------------------------------
-- Comisión compartida entre agentes: cuando un agente quiere ofrecer un
-- inmueble que ya tiene otro agente asignado, en vez de "proponerse como
-- representante" le propone un % de la comisión ya pactada.
-- ---------------------------------------------------------
create table if not exists public.commission_share_proposals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  requesting_agent_id uuid not null references public.profiles(id) on delete cascade,
  assigned_agent_id uuid not null references public.profiles(id) on delete cascade,
  share_percent numeric(5,2) not null check (share_percent >= 10 and share_percent <= 90),
  message text,
  status proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_commission_share_property on public.commission_share_proposals(property_id);
create index if not exists idx_commission_share_requesting on public.commission_share_proposals(requesting_agent_id, status);
create index if not exists idx_commission_share_assigned on public.commission_share_proposals(assigned_agent_id, status);

alter table public.commission_share_proposals enable row level security;

create policy "commission_share_select" on public.commission_share_proposals for select using (
  requesting_agent_id = auth.uid() or assigned_agent_id = auth.uid()
);
create policy "commission_share_insert" on public.commission_share_proposals for insert with check (
  requesting_agent_id = auth.uid()
);
create policy "commission_share_update" on public.commission_share_proposals for update using (
  assigned_agent_id = auth.uid()
);

create unique index if not exists uq_commission_share_pending
  on public.commission_share_proposals(property_id, requesting_agent_id)
  where status = 'pending';

-- Notifica al agente asignado cuando le proponen compartir comisión
create or replace function public.notify_new_commission_share()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link_url)
  values (new.assigned_agent_id, 'new_commission_share', 'Propuesta de comisión compartida',
          'Un agente quiere compartir comisión contigo por uno de tus inmuebles.', '/panel/agente/propuestas');
  return new;
end;
$$;

drop trigger if exists trg_notify_new_commission_share on public.commission_share_proposals;
create trigger trg_notify_new_commission_share
  after insert on public.commission_share_proposals
  for each row execute function public.notify_new_commission_share();

-- ---------------------------------------------------------
-- Cuando un agente le propone a un cliente (requerimiento), puede elegir
-- mostrarle inmuebles puntuales de su cartera.
-- ---------------------------------------------------------
alter table public.requirement_agent_proposals
  add column if not exists shown_property_ids uuid[];
