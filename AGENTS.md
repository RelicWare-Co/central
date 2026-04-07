# AGENTS.md

## Qué es este proyecto

Central es una app interna para organizar proyectos y tareas con una experiencia simple, rápida y confiable. La referencia de producto no es Jira ni Linear; es más cercana a la claridad y baja fricción de Things.

La app existe para que equipos pequeños o medianos puedan ver con facilidad:

- qué proyectos existen
- qué tareas siguen activas
- qué está pendiente
- qué está bloqueado
- qué ya se completó

No estamos construyendo una suite pesada de gestión. Si una idea agrega complejidad operativa sin mejorar claridad, probablemente no entra.

## Principios de producto

- Simplicidad primero.
- Estados visibles y explícitos.
- Jerarquía natural: proyecto -> tarea -> subtarea.
- Debe servir tanto para foco personal como para visibilidad de equipo.
- Uso interno solamente.

## Qué sí entra en el MVP

- Proyectos con responsable, estado y archivo.
- Tareas con proyecto opcional, responsable, prioridad, estado y fecha límite.
- Subtareas simples dentro de una tarea.
- Vistas: Inbox, Hoy, Próximas, Proyectos, detalle de proyecto y Mis tareas.
- Búsqueda básica.
- Filtros por proyecto, responsable, estado, prioridad y fecha.
- Historial básico de cambios.
- Notificaciones simples dentro de la app.

## Qué no entra por ahora

- Sprints.
- Épicas complejas.
- Story points.
- Gantt.
- Dependencias avanzadas.
- Automatizaciones complejas.
- Permisos corporativos granulares.
- Analytics pesados.
- Integraciones externas complejas.

## Stack actual

- Frontend: TanStack Start + React 19 + Vite.
- Estilos: Tailwind CSS v4.
- Runtime/tooling: Bun.
- Lint/format: Biome.
- Backend y auth: PocketBase.

Scripts útiles:

- `bun --bun run dev`
- `bun --bun run build`
- `bun --bun run test`
- `bun --bun run check`
- `bun run pb start`
- `bun run pb migrate`

## Estado real del backend

Ya existe una instancia local de PocketBase en [`/Users/verzach3/Projects/central/pocketbase`](/Users/verzach3/Projects/central/pocketbase) y ya hay migraciones con el modelo base.

Colecciones actuales:

- `users` como auth collection.
- `projects`
- `tasks`
- `subtasks`
- `activity_logs`

### Roles actuales en `users`

- `member`
- `manager`
- `admin`

También existe `isActive`.

### Modelo actual de `projects`

- `name`
- `slug`
- `description`
- `status`: `active | paused | blocked | completed | archived`
- `owner`
- `startDate`
- `dueDate`
- `isArchived`

### Modelo actual de `tasks`

- `title`
- `description`
- `project` opcional para soportar Inbox
- `assignee`
- `createdBy`
- `status`: `pending | in_progress | blocked | completed | canceled`
- `priority`: `low | medium | high`
- `dueDate`
- `startDate`
- `position`
- `blockedReason`
- `isArchived`
- `completedAt`

### Modelo actual de `subtasks`

- `title`
- `task`
- `position`
- `isCompleted`
- `completedAt`

### Modelo actual de `activity_logs`

Se usa para trazabilidad simple. Registra eventos de proyecto/tarea/subtarea con:

- `entityType`
- `action`
- `project`
- `task`
- `actor`
- `targetUser`
- `message`
- `metadata`
- `eventAt`

## Cómo pensar el producto al implementar

- Inbox significa tareas sin proyecto. No fuerces asignación inmediata.
- "Hoy" debe priorizar vencidas, tareas para hoy, prioritarias y en progreso del usuario.
- Una tarea bloqueada debe exponer el motivo (`blockedReason`) cuando exista.
- Subtareas ayudan a descomponer trabajo, pero no reemplazan la tarea principal.
- Completar subtareas no debe completar automáticamente la tarea salvo que esa regla se defina explícitamente más adelante.
- Lo archivado debe desaparecer de vistas principales, pero seguir siendo consultable.

## Reglas de implementación

- Mantén la UI sobria, rápida y con pocas decisiones por pantalla.
- Prefiere flujos manuales y claros antes que automatismos.
- No metas conceptos de PM enterprise.
- Si una feature necesita mucha explicación, probablemente está mal calibrada para este producto.
- Siempre modela el estado de forma explícita; evita estados implícitos derivados de demasiadas reglas.

## PocketBase: guía de integración

- PocketBase es la fuente de verdad para datos y autenticación.
- Usa la colección `users` para login y control básico de roles.
- No dependas de lógica sensible solo en cliente; valida desde reglas de colección o desde server code.
- En queries con input del usuario, usa `pb.filter(expr, params)` para evitar inyección de filtros.
- Para SSR, crea una instancia de PocketBase por request y sincroniza `authStore` con cookies.
- Para cliente web normal, `LocalAuthStore` es suficiente salvo que la estrategia de auth cambie.
- Usa `authRefresh()` para mantener la sesión válida en flujos SSR.
- `pb.authStore.clear()` debe ser la salida estándar para logout.
- Si necesitas tiempo real, usa `subscribe()` solo donde realmente aporte valor; no conviertas toda la app en realtime por defecto.

## Decisiones operativas importantes

- El repo ya tiene helper para PocketBase en [`/Users/verzach3/Projects/central/pocketbase/pb.ts`](/Users/verzach3/Projects/central/pocketbase/pb.ts).
- El frontend todavía parece partir del template base de TanStack Start; toca reemplazar demos y estructura genérica por la app real.
- Si vas a integrar el SDK JS en la app, asegúrate de agregar la dependencia `pocketbase` al `package.json` cuando corresponda.
- Usa `activity_logs` para historial simple visible, no para auditoría corporativa compleja.
- Las notificaciones del MVP deben ser in-app; email/push puede esperar.

## Prioridad de construcción recomendada

1. Base de auth con PocketBase.
2. Layout y navegación principal.
3. Proyectos.
4. Tareas.
5. Subtareas.
6. Inbox.
7. Hoy.
8. Mis tareas.
9. Búsqueda y filtros.
10. Historial básico.

## Si vuelves a este repo en el futuro

Primero verifica que cualquier cambio siga respetando esta idea central: claridad operativa con mínima fricción. Si una solución se siente poderosa pero pesada, no es el producto correcto.

Antes de ampliar el modelo, revisa las migraciones existentes en [`/Users/verzach3/Projects/central/pocketbase/pb_migrations/1773791658_create_internal_project_management_schema.js`](/Users/verzach3/Projects/central/pocketbase/pb_migrations/1773791658_create_internal_project_management_schema.js) y [`/Users/verzach3/Projects/central/pocketbase/pb_migrations/1773791839_add_activity_logs.js`](/Users/verzach3/Projects/central/pocketbase/pb_migrations/1773791839_add_activity_logs.js). La intención original ya está bastante clara ahí: app interna, simple, con estados explícitos y trazabilidad mínima.

<!-- intent-skills:start -->
# Skill mappings - when working in these areas, load the linked skill file into context.
skills:
  - task: "Building routes, navigation, data loading, auth guards, URL search params, and type-safe routing with TanStack Router"
    load: "node_modules/@tanstack/router-core/skills/router-core/SKILL.md"
  - task: "Adding, configuring, or composing shadcn/ui components"
    load: "node_modules/radix-ui/skills/shadcn/SKILL.md"
  - task: "Designing, reviewing, or auditing UI for premium visual design and accessibility"
    load: "node_modules/@kilo-org/kilocode/skills/design-taste-frontend/SKILL.md"
  - task: "Setting up, extending, or debugging Tiptap rich text editor in React"
    # To load this skill, run: npx @tanstack/intent@latest list | grep tiptap
  - task: "Working with PocketBase collections, auth, API rules, file storage, or JS hooks"
    # To load this skill, run: npx @tanstack/intent@latest list | grep pocketbase
<!-- intent-skills:end -->

## Cursor Cloud specific instructions

### Services overview

| Service | Command | Port |
|---------|---------|------|
| PocketBase (backend + auth + DB) | `./pocketbase/pocketbase serve --http=127.0.0.1:8090 --dir=./pocketbase/pb_data --migrationsDir=./pocketbase/pb_migrations --hooksDir=./pocketbase/pb_hooks` | 8090 |
| Vite dev server (frontend SPA) | `bun --bun run dev` | 3000 |

Start PocketBase **before** the frontend — all data and auth calls go to PocketBase.

### PocketBase binary

The committed binary is a macOS arm64 Mach-O executable. On Linux x86_64 (Cloud Agent VMs), it will not run. Download the correct Linux amd64 binary on first use:

```bash
cd /workspace/pocketbase
curl -L -o pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v0.36.7/pocketbase_0.36.7_linux_amd64.zip"
unzip -o pb.zip -d . && rm pb.zip && chmod +x pocketbase
```

The `bun run pb start` script (via `pocketbase/pb.ts`) will also auto-download, but it requires Bun and uses `Bun.write` / `$` shell — running the binary directly is more reliable in Cloud Agent environments.

### First-run setup

On a fresh `pb_data`, PocketBase auto-applies migrations. Create a superuser for the admin dashboard:

```bash
./pocketbase/pocketbase superuser upsert admin@central.dev admin123456 --dir=./pocketbase/pb_data
```

Then create a regular user for testing the app (the frontend requires a `users` collection auth record):

```bash
curl -s http://127.0.0.1:8090/api/collections/users/records -H "Content-Type: application/json" -X POST \
  -d '{"email":"testuser@central.dev","password":"testpass123","passwordConfirm":"testpass123","name":"Test User","role":"admin","isActive":true}'
```

### Hooks warning

`pocketbase/pb_hooks/activity.pb.js` uses a legacy PocketBase JSVM API (`onRecordAfterCreateRequest`). On PocketBase v0.36.x this logs a non-fatal error at startup. It does not prevent the server from running.

### Lint / test / build

See `package.json` scripts. All use `bun --bun run <script>`:

- **Lint/format**: `bun --bun run check` (Biome)
- **Tests**: `bun --bun run test` (Vitest, 2 test files / 9 tests)
- **Build**: `bun --bun run build` (Vite production build)
