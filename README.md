# Ubicas

Plataforma inmobiliaria que conecta propietarios, agentes inmobiliarios y
compradores/arrendatarios — incluyendo la publicación de **requerimientos de
búsqueda**, no solo de inmuebles.

> **Estado actual: Sistema de diseño (Fase 0) + Módulo propietario (Fase 1)
> completados**, además de la autenticación por roles de la fase anterior.
> El propietario ya puede publicar, gestionar, medir y recibir propuestas
> sobre sus inmuebles de extremo a extremo. Ver "Actualizar un proyecto ya
> instalado" más abajo si ya tenías Ubicas corriendo.

## 1. Requisitos

- Node.js 18+
- Una cuenta gratuita en [supabase.com](https://supabase.com)

## 2. Crear el proyecto en Supabase

1. Crea un nuevo proyecto en Supabase.
2. Ve a **SQL Editor** y pega el contenido de `supabase/schema.sql`. Ejecútalo
   completo (crea tablas, enums, índices, triggers, funciones y políticas RLS).
3. (Opcional, datos demo) Crea 3 usuarios desde **Authentication > Users >
   Add user** con los correos indicados en `supabase/seed.sql`, copia sus UUID,
   reemplázalos en ese archivo y ejecútalo en el SQL Editor.
3.1. **Si ya tenías un schema anterior ejecutado**, corre también en orden:
   `supabase/migrations/002_owner_module.sql`,
   `supabase/migrations/003_fix_rls_recursion.sql` y
   `supabase/migrations/004_agent_module.sql`. Ninguna borra datos existentes.
4. Ve a **Project Settings > API** y copia:
   - `Project URL`
   - `anon public key`
5. En **Storage**, crea dos buckets públicos: `property-images` (fotos de
   inmuebles) y `avatars` (fotos de perfil de propietarios/agentes).

## 3. Configurar el proyecto localmente

```bash
cp .env.example .env
# Edita .env y pega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## 4. Probar el sistema de diseño y el módulo propietario

1. Inicia sesión con una cuenta de rol **propietario**.
2. Entra a `/panel/propietario` (o desde el navbar, "Mi panel"): debes ver el
   resumen con conteo de inmuebles por estado y el botón rojo "Publicar
   inmueble gratis".
3. Click en "Publicar inmueble gratis" → completa los 5 pasos del wizard
   (`/publicar-inmueble`). Prueba:
   - "Guardar borrador" en cualquier paso — no debe hacerlo público.
   - Subir 2-3 fotos, reordenarlas y cambiar la foto principal.
   - Completar todos los pasos y "Publicar inmueble".
4. Ve a **Mis inmuebles** (`/panel/propietario/inmuebles`): tu inmueble debe
   aparecer con foto, estado "Publicado" y botones de Pausar / Marcar
   vendido / Cerrar, etc. Prueba pausar y reactivar.
5. Abre `/inmuebles` en una ventana de incógnito (o cierra sesión): tu
   inmueble publicado debe aparecer en el mercado público, con los filtros
   funcionando (operación, tipo, distrito, precio, dormitorios, baños,
   cochera).
6. Click en la tarjeta → ficha detallada (`/inmuebles/:id`): galería,
   características, descripción, amenidades y botones de favoritos/contacto/
   visita (inicia sesión con una cuenta de comprador para probarlos).
7. Vuelve al panel del propietario → **Contactos y visitas**: el contacto o
   la visita que acabas de enviar debe aparecer ahí, con opción de aceptar/
   rechazar visitas y marcar contactos como atendidos.
8. **Métricas**: confirma que las vistas, contactos y visitas del inmueble
   se reflejan correctamente.
9. **Propuestas de agentes**: para probar el flujo completo necesitas una
   cuenta de rol agente que envíe una propuesta directamente desde Supabase
   (tabla `agent_proposals`) hasta que se construya el panel de agente en la
   siguiente fase; luego, en el panel del propietario, acepta o rechaza la
   propuesta y confirma que al aceptar se cree la fila en
   `property_agent_assignments`.

## 5. Probar el módulo del agente (Fase 2)

1. Registra o inicia sesión con una cuenta de rol **agente**.
2. Ve a **Mi perfil** (`/panel/agente/perfil`): sube una foto, completa
   inmobiliaria, zonas de trabajo y descripción, guarda y confirma que se
   actualice el badge de "Verificación pendiente" (la verificación real la
   activa un administrador directamente en la base de datos por ahora, con
   `update profiles set agent_verified = true where id = '...'`).
3. Ve a `/inmuebles`, abre cualquier inmueble publicado por un propietario
   (con otra cuenta) y click en **"Proponerme para representarlo"**.
   Completa la presentación y la comisión (% si es venta, monto si es
   alquiler) y envíala.
4. Confirma en **Mis propuestas** (`/panel/agente/propuestas`) que aparece
   como "Pendiente".
5. Inicia sesión con la cuenta del **propietario** dueño de ese inmueble →
   **Propuestas de agentes** → acepta la propuesta.
6. Vuelve a la cuenta del agente: en **Inmuebles vinculados** debe aparecer
   el inmueble, y en **Mis propuestas** el estado debe decir "Aceptada".
7. Abre la ficha pública del inmueble sin sesión: el contacto principal debe
   mostrarse ahora como "Agente verificado" (o pendiente si no se activó el
   paso 2) con tu nombre, en vez del propietario.

## 6. Probar la autenticación por roles (heredado de la fase de auth)

1. Entra a `/register`, elige un perfil (propietario, agente o comprador),
   completa el formulario y crea la cuenta.
2. Supabase enviará un correo de confirmación (si tu proyecto lo tiene
   habilitado). Confírmalo o desactiva la confirmación de correo en
   **Authentication > Providers > Email** mientras desarrollas.
3. Inicia sesión en `/login`.
4. Verifica que:
   - `/panel/propietario` solo es accesible por el rol propietario
     (`/dashboard/agent` y `/dashboard/buyer` siguen siendo pantallas
     temporales para los otros roles, se completan en fases siguientes).
   - Cerrar sesión desde el navbar limpia la sesión y bloquea rutas privadas.
   - La fila correspondiente se creó automáticamente en la tabla
     `public.profiles` (trigger `handle_new_user`).

## 7. Estructura del proyecto

```
src/
  components/        Navbar, Logo, PanelSidebar
  components/ui/      Sistema de diseño (Fase 0): Button, Input, Select,
                        Textarea, ImageUpload, PropertyCard, StatusBadge,
                        MetricCard, AdminTable, Modal, Alert, EmptyState,
                        LoadingState, ConfirmDialog
  layouts/             OwnerPanelLayout, AgentPanelLayout
  pages/               Landing, Login, Register, PropertyList, PropertyDetail
  pages/owner/          Dashboard, Properties, PublishWizard, Contacts,
                        Proposals, Metrics, Profile (Fase 1)
  pages/agent/           Dashboard, Properties, Proposals, Profile (Fase 2)
  contexts/            AuthContext (sesión + perfil + rol)
  routes/               ProtectedRoute (por sesión y por rol)
  hooks/                 useOwnerProperties.ts, useAgentData.ts
  lib/                    cliente Supabase + helpers de Storage (inmuebles y avatares)
  types/                   tipos alineados al esquema SQL
supabase/
  schema.sql            esquema base (Fase anterior: auth + tablas)
  migrations/002_owner_module.sql     estados y campos del wizard, Storage inmuebles
  migrations/003_fix_rls_recursion.sql corrige recursión infinita en RLS
  migrations/004_agent_module.sql       Storage avatares, propuestas sin duplicados
  seed.sql               datos de demostración
```

## 8. Plan de fases

- [x] **Fase de autenticación** — Estructura, esquema SQL + RLS, login/registro por roles.
- [x] **Fase 0** — Sistema de diseño: tokens de marca, tipografía Poppins, 18 componentes reutilizables.
- [x] **Fase 1** — Módulo propietario completo: panel (HU-01), wizard de publicación de 5 pasos (HU-02),
      bandeja de inmuebles con filtros y acciones de estado (HU-03), mercado público con filtros (HU-04),
      ficha detallada con favoritos/contacto/visita (HU-05), contactos/visitas/métricas (HU-06),
      propuestas de agentes con aceptar/rechazar (HU-07).
- [x] **Fase 2** — Panel y perfil del agente: perfil profesional con foto, zonas y descripción; envío de
      propuestas a propietarios desde cualquier ficha de inmueble; bandeja de propuestas enviadas con estado;
      inmuebles vinculados tras aceptación.
- [ ] **Fase 3** — Requerimientos de búsqueda del comprador/arrendatario, propuestas de agentes sobre ellos, panel del comprador.
- [ ] **Fase 4** — Conversaciones/mensajería interna y notificaciones in-app.
- [ ] **Fase 5** — Panel de administración para verificar agentes (hoy se activa manualmente por SQL).
- [ ] **Fase 6** — Pulido responsive final, validaciones finas adicionales, QA end-to-end.

## 9. Notas de diseño (Fase 0)

- Tokens de marca en `tailwind.config.js`: `brand` (#E31345), `brand-hover`
  (#C90F3A), `brand-soft` (#FFF2F5), `ink`/`ink-light` (texto), `surface`/
  `surface-muted` (fondos), `border`, `success`.
- Tipografía: Poppins (cargada en `index.html` desde Google Fonts).
- Bordes: `rounded-input` (10px) para inputs/botones, `rounded-card` (16px)
  para tarjetas y paneles.
- El logo actual (`src/components/Logo.tsx`) es un placeholder (ícono de pin +
  wordmark "UBICAS" en texto). El brief pide usar el archivo de logo oficial
  y no redibujar el wordmark — en cuanto compartas el archivo, se reemplaza
  en ese único componente y en `public/favicon.svg`.

## 10. Actualizar un proyecto ya instalado (guía fácil)

Si ya tenías Ubicas corriendo en tu máquina (de la fase de autenticación) y
solo quieres traer el sistema de diseño + módulo propietario, sigue estos
pasos en orden. No necesitas repetir la creación del proyecto de Supabase.

1. **Descarga el zip nuevo** que te compartí y descomprímelo en cualquier
   carpeta temporal (no la pises todavía sobre tu proyecto actual).
2. **Reemplaza la carpeta `src/` completa**: borra tu `src/` actual y copia
   la del zip nuevo en su lugar. Haz lo mismo con `tailwind.config.js` e
   `index.html` (cambiaron los tokens de color y se agregó la fuente
   Poppins).
3. **Corre las migraciones nuevas** (en este orden): en Supabase, ve a
   **SQL Editor** y ejecuta, una por una, el contenido de:
   - `supabase/migrations/002_owner_module.sql` (si aún no la habías corrido)
   - `supabase/migrations/003_fix_rls_recursion.sql`
   - `supabase/migrations/004_agent_module.sql`
   Ninguna borra lo que ya tienes, solo agregan columnas, funciones y políticas.
4. **Crea el bucket `avatars`** en Storage (además de `property-images` si
   aún no lo tenías): **Storage > New bucket**, nombre exacto `avatars`,
   márcalo como **Public bucket**.
5. **Verifica que no falten paquetes**: abre tu `package.json` y compáralo
   con el del zip. Si ves que falta `clsx` en `dependencies`, agrégalo y
   corre `npm install` de nuevo. Si tu `package.json` ya era idéntico, no
   hace falta reinstalar nada.
6. **Reinicia el servidor**: `Ctrl + C` en la terminal donde corre
   `npm run dev`, y vuelve a correr `npm run dev`.
7. **Prueba** siguiendo la sección 4 de este README ("Probar el sistema de
   diseño y el módulo propietario").

Si en cualquier paso ves un error en la terminal o en la consola del
navegador (F12 → Console), pégamelo tal cual aparece y lo resolvemos.
