# Ubicas — Contexto del proyecto

Plataforma inmobiliaria peruana que conecta tres roles: **Propietarios**, **Agentes
inmobiliarios** y **Clientes** (compradores/arrendatarios). El diferenciador es que
no solo se publican inmuebles (oferta) — también se publican **requerimientos**
("Clientes activos"), es decir, la demanda: personas que buscan comprar o alquilar,
para que propietarios y agentes las encuentren.

## Stack técnico

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + react-router-dom
- **Backend:** Supabase (PostgreSQL + Auth + Storage), sin backend propio — toda la
  lógica de negocio vive en RLS (Row Level Security) y funciones `plpgsql` (RPC)
- **Mapas:** Leaflet + OpenStreetMap (sin API key de pago)
- **Deploy:** Vercel, conectado a GitHub (push a `main` = deploy automático)
- **Dominio:** en proceso de conectar `ubicass.com` (nameservers ya apuntan a
  Vercel; falta terminar de validar)

## Roles y autenticación

- Registro con selección de rol: `owner` (propietario), `agent` (agente), `buyer`
  (cliente/comprador-arrendatario)
- Tabla `profiles` (1:1 con `auth.users`), con trigger que la crea automáticamente
  al registrarse
- Flag `is_admin` en `profiles` para el panel de administración (se activa
  manualmente por SQL, no es un rol seleccionable)
- `ProtectedRoute` (por sesión + rol) y `AdminRoute` (por flag) en `src/routes/`

## Estructura de carpetas (src/)

```
components/        Navbar, Logo, PanelSidebar, NotificationBell, ZoneMultiSelect,
                    PricePopover, SortDropdown, FilterSidePanel, BottomSheet,
                    ContactRequestModal, RequirementCard, WizardStepper, etc.
components/ui/       Sistema de diseño: Button, Input, Select, Textarea, ImageUpload,
                    PropertyCard, StatusBadge, MetricCard, AdminTable, Modal, Alert,
                    EmptyState, LoadingState, ConfirmDialog, MultiSelectDropdown
layouts/             OwnerPanelLayout, AgentPanelLayout, BuyerPanelLayout
pages/               Landing (Home), Login, Register, PropertyList (/inmuebles),
                    PropertyDetail, RequirementsList (/requerimientos, "Clientes"),
                    RequirementDetail, Messages (/mensajes)
pages/owner/          Dashboard, Properties (bandeja), PublishWizard (3 pasos),
                    Contacts, Proposals, Metrics, Profile
pages/agent/           Dashboard, Properties, Proposals, Profile
pages/buyer/            Favorites, Contacts, Requirements, PublishRequirement,
                    Proposals, Profile
pages/admin/             AdminAgents (verificar agentes)
contexts/            AuthContext (sesión + perfil + rol)
hooks/                 useOwnerProperties, useAgentData, useBuyerData,
                    useNotifications, useConversations
lib/                    supabase.ts (cliente), storage.ts, limaDistricts.ts
                    (coordenadas aproximadas por distrito, sustituto de Google
                    Places), guestContact.ts (localStorage), requirementHelpers.ts
types/                   database.ts — tipos alineados al esquema SQL
```

## Base de datos (Supabase)

Ejecutar en este orden en el SQL Editor:
1. `supabase/schema.sql` — esquema base: tablas, RLS, autenticación
2. `supabase/migrations/002_owner_module.sql` — wizard de publicación, Storage inmuebles
3. `003_fix_rls_recursion.sql` — corrige recursión infinita en políticas RLS
4. `004_agent_module.sql` — Storage avatares, evita propuestas duplicadas
5. `005_buyer_module.sql` — evita propuestas duplicadas a requerimientos
6. `006_notifications.sql` — notificaciones automáticas vía triggers
7. `007_admin_module.sql` — flag `is_admin`
8. `008_price_history.sql` — precio original, para "bajaron de precio"
9. `009_guest_contacts.sql` — contacto sin cuenta (invitados)
10. `010_requirements_marketplace.sql` — urgencia obligatoria, área mínima,
    descripción, expiración automática, tipo "Proyecto"
11. `011_requirement_favorites.sql` — favoritos también para requerimientos

Tablas principales: `profiles`, `properties`, `property_images`,
`property_features`, `agent_proposals`, `property_agent_assignments`,
`requirements`, `requirement_agent_proposals`, `property_views`, `favorites`,
`contact_requests`, `visit_requests`, `conversations`, `messages`, `notifications`.

También hay scripts de datos demo en `supabase/` (`seed_10_properties.sql`,
`seed_20_properties_10_requirements.sql`) que cargan inmuebles y requerimientos de
prueba buscando las cuentas por correo (no requieren copiar UUIDs a mano).

## Funcionalidades ya construidas (completas y funcionando)

- **Propietario:** wizard de publicación en 3 pasos (datos principales → descripción
  e imágenes → publicación, con guardado automático), bandeja de inmuebles, métricas,
  contactos/visitas, propuestas de agentes
- **Agente:** perfil profesional con foto, inmuebles vinculados, propuestas enviadas
  (a propietarios y a requerimientos), verificación por admin
- **Cliente:** publicar requerimiento, favoritos, contactos/visitas, propuestas
  recibidas
- **Marketplace de inmuebles** (`/inmuebles`): filtros (operación, ubicación
  multi-select, tipo, precio, dormitorios, "más filtros" con superficie/baños/
  estacionamientos/antigüedad/fecha/amenidades), ordenar, vista lista/mapa
- **Marketplace de clientes** (`/requerimientos`): mismo patrón visual que
  Inmuebles (a propósito, para que se sienta como el mismo componente). Tarjetas
  sin foto (brief ejecutivo: operación, título, presupuesto como elemento
  dominante, características, fecha esperada, descripción) con **Indicador de
  Oportunidad** automático (🔴 Urgente / 🟡 Próximo / 🟢 Flexible según urgencia)
- **Contacto:** modal unificado con ramas por rol — invitado sin cuenta (pide
  nombre/correo/teléfono, se recuerda en el dispositivo vía localStorage), cuenta
  logueada (pre-llenado), agente (puede ofrecerse como representante con comisión
  %→monto en vez de solo contactar). Al enviar, revela los datos de contacto del
  propietario/agente dueño de la publicación. El botón cambia a "Ver contacto"
  una vez usado.
- **Mensajería interna** (`/mensajes`) y **notificaciones in-app** (campanita,
  generadas por triggers de base de datos)
- **Panel admin** (`/admin/agentes`): verificar/quitar verificación a agentes
- Diseño responsive (mobile-first), con ajustes específicos para que la barra de
  filtros no sature pantallas chicas (los filtros secundarios se mueven a "Más
  filtros" en móvil)

## Limitaciones conocidas (documentadas, no son bugs)

- **Sin Google Places real:** la búsqueda de ubicación usa una lista local de
  distritos de Lima (`src/lib/limaDistricts.ts`) con coordenadas aproximadas, no
  la API de Google Places (requiere key de pago no configurada)
- **Sin paginación real** en los listados (se traen todos los resultados que
  matchean los filtros)
- **Expiración de requerimientos:** se calcula una fecha de expiración al
  publicar (según la urgencia) y se filtra en las consultas — no hay un cron job
  que cambie el estado a "Expirado" en la base de datos
- El campo de distrito en las publicaciones es texto libre elegido de una lista
  cerrada (no hay geocodificación real), así que el filtro por ubicación depende
  de coincidencia exacta de texto

## Variables de entorno (.env)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

---

**Nota para Claude Code:** este proyecto viene de una sesión larga de trabajo en
claude.ai. Todo el código ya está en este repositorio (no falta nada por traer).
Antes de hacer cambios grandes, revisa los archivos relevantes para entender los
patrones ya establecidos (por ejemplo: los componentes de filtros/dropdowns siguen
un patrón consistente con `useRef` + listener de clic afuera; los formularios
grandes usan un patrón de guardado automático con `debounce`; las páginas de
lista siguen todas la misma estructura de header → barra de filtros → grilla).
