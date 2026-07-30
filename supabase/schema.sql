-- =========================================================
-- UBICAS - Esquema de base de datos (Supabase / PostgreSQL)
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase, en orden, una sola vez.
-- Requiere la extensión pgcrypto para gen_random_uuid() (ya viene
-- habilitada por defecto en proyectos Supabase).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
create type user_role as enum ('owner', 'agent', 'buyer');
create type operation_type as enum ('sale', 'rent');
create type property_type as enum ('apartment', 'house', 'office', 'land', 'commercial', 'other');
create type property_status as enum ('draft', 'published', 'paused', 'closed');
create type proposal_status as enum ('pending', 'accepted', 'rejected');
create type visit_status as enum ('pending', 'accepted', 'rejected', 'completed');
create type requirement_status as enum ('active', 'paused', 'closed');

-- ---------------------------------------------------------
-- PROFILES (1:1 con auth.users)
-- ---------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  phone text,
  avatar_url text,
  -- campos específicos de agente
  agency_name text,
  agent_description text,
  agent_zones text[],
  agent_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PROPERTIES
-- ---------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  operation operation_type not null,
  property_type property_type not null,
  title text not null,
  description text,
  district text not null,
  city text not null default 'Lima',
  address text,
  lat double precision,
  lng double precision,
  price numeric(12,2) not null,
  currency text not null default 'PEN',
  area_m2 numeric(8,2),
  bedrooms int,
  bathrooms int,
  parking_spots int,
  status property_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_properties_status on public.properties(status);
create index idx_properties_owner on public.properties(owner_id);
create index idx_properties_district on public.properties(district);
create index idx_properties_operation_type on public.properties(operation, property_type);
create index idx_properties_price on public.properties(price);

-- ---------------------------------------------------------
-- PROPERTY IMAGES
-- ---------------------------------------------------------
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_property_images_property on public.property_images(property_id);

-- ---------------------------------------------------------
-- PROPERTY FEATURES (atributos libres tipo tag: "piscina", "terraza"...)
-- ---------------------------------------------------------
create table public.property_features (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  feature text not null
);

create index idx_property_features_property on public.property_features(property_id);

-- ---------------------------------------------------------
-- PROPERTY <-> AGENT ASSIGNMENT (vínculo activo, 1 por inmueble)
-- ---------------------------------------------------------
create table public.property_agent_assignments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  proposal_id uuid,
  assigned_at timestamptz not null default now()
);

create index idx_assignments_agent on public.property_agent_assignments(agent_id);

-- ---------------------------------------------------------
-- AGENT PROPOSALS (agente -> propietario, sobre un inmueble)
-- ---------------------------------------------------------
create table public.agent_proposals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  pitch text not null,
  commission_percent numeric(5,2),   -- usado si operation = sale
  commission_amount numeric(12,2),   -- usado si operation = rent
  status proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint commission_matches_operation check (
    (commission_percent is not null) or (commission_amount is not null)
  )
);

create index idx_agent_proposals_owner on public.agent_proposals(owner_id, status);
create index idx_agent_proposals_agent on public.agent_proposals(agent_id, status);
create index idx_agent_proposals_property on public.agent_proposals(property_id);

alter table public.property_agent_assignments
  add constraint fk_assignment_proposal foreign key (proposal_id)
  references public.agent_proposals(id) on delete set null;

-- ---------------------------------------------------------
-- REQUIREMENTS (búsqueda publicada por comprador/arrendatario)
-- ---------------------------------------------------------
create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  operation operation_type not null,
  property_type property_type not null,
  district text not null,
  max_budget numeric(12,2) not null,
  bedrooms int,
  bathrooms int,
  parking boolean not null default false,
  pets boolean not null default false,
  target_date date,
  extra_notes text,
  status requirement_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_requirements_status on public.requirements(status);
create index idx_requirements_buyer on public.requirements(buyer_id);
create index idx_requirements_district on public.requirements(district);

-- ---------------------------------------------------------
-- REQUIREMENT AGENT PROPOSALS (agente -> comprador, sobre un requerimiento)
-- ---------------------------------------------------------
create table public.requirement_agent_proposals (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  pitch text not null,
  status proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_req_proposals_buyer on public.requirement_agent_proposals(buyer_id, status);
create index idx_req_proposals_agent on public.requirement_agent_proposals(agent_id, status);
create index idx_req_proposals_requirement on public.requirement_agent_proposals(requirement_id);

-- ---------------------------------------------------------
-- PROPERTY VIEWS (métrica de vistas)
-- ---------------------------------------------------------
create table public.property_views (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index idx_property_views_property on public.property_views(property_id);

-- ---------------------------------------------------------
-- FAVORITES
-- ---------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create index idx_favorites_user on public.favorites(user_id);
create index idx_favorites_property on public.favorites(property_id);

-- ---------------------------------------------------------
-- CONTACT REQUESTS (intento de contacto sobre un inmueble)
-- ---------------------------------------------------------
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  created_at timestamptz not null default now()
);

create index idx_contact_requests_property on public.contact_requests(property_id);
create index idx_contact_requests_requester on public.contact_requests(requester_id);

-- ---------------------------------------------------------
-- VISIT REQUESTS
-- ---------------------------------------------------------
create table public.visit_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  proposed_date timestamptz not null,
  status visit_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_visit_requests_property on public.visit_requests(property_id);
create index idx_visit_requests_requester on public.visit_requests(requester_id);

-- ---------------------------------------------------------
-- CONVERSATIONS & MESSAGES
-- ---------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (property_id, participant_a, participant_b)
);

create index idx_conversations_participants on public.conversations(participant_a, participant_b);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at);

-- ---------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, -- 'new_contact' | 'new_proposal' | 'proposal_accepted' | 'visit_request' | ...
  title text not null,
  body text,
  link_url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, read);

-- =========================================================
-- FUNCIONES / TRIGGERS
-- =========================================================

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger trg_requirements_updated_at before update on public.requirements
  for each row execute function public.set_updated_at();
create trigger trg_visit_requests_updated_at before update on public.visit_requests
  for each row execute function public.set_updated_at();

-- Crea automáticamente la fila en profiles cuando se registra un usuario
-- (el rol y nombre llegan en raw_user_meta_data desde el signUp del frontend)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RPC: aceptar propuesta de agente sobre un inmueble -> vincula agente atómicamente
create or replace function public.accept_agent_proposal(p_proposal_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_proposal record;
begin
  select * into v_proposal from public.agent_proposals where id = p_proposal_id for update;

  if v_proposal is null then
    raise exception 'Propuesta no encontrada';
  end if;

  if v_proposal.owner_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  if v_proposal.status <> 'pending' then
    raise exception 'La propuesta ya fue resuelta';
  end if;

  update public.agent_proposals
    set status = 'accepted', resolved_at = now()
    where id = p_proposal_id;

  -- rechaza automáticamente otras propuestas pendientes sobre el mismo inmueble
  update public.agent_proposals
    set status = 'rejected', resolved_at = now()
    where property_id = v_proposal.property_id
      and id <> p_proposal_id
      and status = 'pending';

  insert into public.property_agent_assignments (property_id, agent_id, proposal_id)
  values (v_proposal.property_id, v_proposal.agent_id, p_proposal_id)
  on conflict (property_id) do update
    set agent_id = excluded.agent_id, proposal_id = excluded.proposal_id, assigned_at = now();

  insert into public.notifications (user_id, type, title, body, link_url)
  values (v_proposal.agent_id, 'proposal_accepted', 'Propuesta aceptada',
          'Tu propuesta fue aceptada y ahora representas este inmueble.',
          '/inmuebles/' || v_proposal.property_id);
end;
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_features enable row level security;
alter table public.property_agent_assignments enable row level security;
alter table public.agent_proposals enable row level security;
alter table public.requirements enable row level security;
alter table public.requirement_agent_proposals enable row level security;
alter table public.property_views enable row level security;
alter table public.favorites enable row level security;
alter table public.contact_requests enable row level security;
alter table public.visit_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- PROFILES: cualquiera autenticado o no puede leer perfiles públicos básicos;
-- solo el dueño puede editar el suyo.
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- PROPERTIES: publicados son públicos; borradores/pausados solo visibles para el dueño o agente asignado.
create policy "properties_select_published_or_own" on public.properties for select using (
  status = 'published'
  or owner_id = auth.uid()
  or exists (
    select 1 from public.property_agent_assignments a
    where a.property_id = properties.id and a.agent_id = auth.uid()
  )
);
create policy "properties_insert_own" on public.properties for insert with check (owner_id = auth.uid());
create policy "properties_update_own" on public.properties for update using (owner_id = auth.uid());
create policy "properties_delete_own" on public.properties for delete using (owner_id = auth.uid());

-- PROPERTY IMAGES / FEATURES: siguen la visibilidad del inmueble padre; solo el owner escribe.
create policy "property_images_select" on public.property_images for select using (
  exists (select 1 from public.properties p where p.id = property_images.property_id
    and (p.status = 'published' or p.owner_id = auth.uid()))
);
create policy "property_images_write_own" on public.property_images for all using (
  exists (select 1 from public.properties p where p.id = property_images.property_id and p.owner_id = auth.uid())
) with check (
  exists (select 1 from public.properties p where p.id = property_images.property_id and p.owner_id = auth.uid())
);

create policy "property_features_select" on public.property_features for select using (
  exists (select 1 from public.properties p where p.id = property_features.property_id
    and (p.status = 'published' or p.owner_id = auth.uid()))
);
create policy "property_features_write_own" on public.property_features for all using (
  exists (select 1 from public.properties p where p.id = property_features.property_id and p.owner_id = auth.uid())
) with check (
  exists (select 1 from public.properties p where p.id = property_features.property_id and p.owner_id = auth.uid())
);

-- ASSIGNMENTS: visible para el propietario del inmueble y el agente asignado.
create policy "assignments_select" on public.property_agent_assignments for select using (
  agent_id = auth.uid()
  or exists (select 1 from public.properties p where p.id = property_agent_assignments.property_id and p.owner_id = auth.uid())
);

-- AGENT PROPOSALS: solo emisor (agente) y receptor (propietario) las ven.
create policy "agent_proposals_select" on public.agent_proposals for select using (
  agent_id = auth.uid() or owner_id = auth.uid()
);
create policy "agent_proposals_insert" on public.agent_proposals for insert with check (agent_id = auth.uid());
create policy "agent_proposals_update_owner_resolves" on public.agent_proposals for update using (
  owner_id = auth.uid() or agent_id = auth.uid()
);

-- REQUIREMENTS: activos visibles para todos los autenticados (para que owners/agentes los vean);
-- el dueño del requerimiento siempre lo ve y edita.
create policy "requirements_select" on public.requirements for select using (
  status = 'active' or buyer_id = auth.uid()
);
create policy "requirements_insert_own" on public.requirements for insert with check (buyer_id = auth.uid());
create policy "requirements_update_own" on public.requirements for update using (buyer_id = auth.uid());
create policy "requirements_delete_own" on public.requirements for delete using (buyer_id = auth.uid());

-- REQUIREMENT AGENT PROPOSALS: solo emisor (agente) y receptor (comprador).
create policy "req_proposals_select" on public.requirement_agent_proposals for select using (
  agent_id = auth.uid() or buyer_id = auth.uid()
);
create policy "req_proposals_insert" on public.requirement_agent_proposals for insert with check (agent_id = auth.uid());
create policy "req_proposals_update" on public.requirement_agent_proposals for update using (
  buyer_id = auth.uid() or agent_id = auth.uid()
);

-- PROPERTY VIEWS: cualquiera autenticado o anónimo puede insertar (registro de vista);
-- solo el propietario del inmueble puede leer el detalle.
create policy "property_views_insert_any" on public.property_views for insert with check (true);
create policy "property_views_select_owner" on public.property_views for select using (
  exists (select 1 from public.properties p where p.id = property_views.property_id and p.owner_id = auth.uid())
);

-- FAVORITES: cada usuario ve y gestiona los suyos.
create policy "favorites_all_own" on public.favorites for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- CONTACT REQUESTS: el solicitante y el propietario del inmueble pueden ver.
create policy "contact_requests_select" on public.contact_requests for select using (
  requester_id = auth.uid()
  or exists (select 1 from public.properties p where p.id = contact_requests.property_id and p.owner_id = auth.uid())
);
create policy "contact_requests_insert" on public.contact_requests for insert with check (requester_id = auth.uid());

-- VISIT REQUESTS: el solicitante y el propietario del inmueble pueden ver/actualizar.
create policy "visit_requests_select" on public.visit_requests for select using (
  requester_id = auth.uid()
  or exists (select 1 from public.properties p where p.id = visit_requests.property_id and p.owner_id = auth.uid())
);
create policy "visit_requests_insert" on public.visit_requests for insert with check (requester_id = auth.uid());
create policy "visit_requests_update" on public.visit_requests for update using (
  requester_id = auth.uid()
  or exists (select 1 from public.properties p where p.id = visit_requests.property_id and p.owner_id = auth.uid())
);

-- CONVERSATIONS / MESSAGES: solo los participantes.
create policy "conversations_select" on public.conversations for select using (
  participant_a = auth.uid() or participant_b = auth.uid()
);
create policy "conversations_insert" on public.conversations for insert with check (
  participant_a = auth.uid() or participant_b = auth.uid()
);
create policy "messages_select" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = messages.conversation_id
    and (c.participant_a = auth.uid() or c.participant_b = auth.uid()))
);
create policy "messages_insert" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.conversations c where c.id = messages.conversation_id
    and (c.participant_a = auth.uid() or c.participant_b = auth.uid()))
);

-- NOTIFICATIONS: cada usuario solo ve/actualiza las suyas.
create policy "notifications_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update using (user_id = auth.uid());
