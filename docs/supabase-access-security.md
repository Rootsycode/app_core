# Seguridad de acceso a Supabase (Rootsy / multi-tenant)

Documento de referencia para **humanos y asistentes (Cursor)** al implementar RLS, RPC, server actions y cualquier lectura/escritura contra Postgres en Supabase.

---

## 1. Objetivo

Garantizar que **ningún cliente acceda a datos de otro POP** y que **ninguna acción** se ejecute sin cumplir la cadena de autorización del producto, tanto en **RLS** como en la **capa de aplicación** cuando corresponda.

**Tenant en datos de negocio:** `pop_id` (equivale a `tenant_id` en este producto).

---

## 2. Modelo de negocio (reglas del producto)

### 2.1 Punto de venta (POP)

- Cada POP tiene **un único owner** (`pops.owner_user_id`): quien **paga la suscripción** y es responsable del POP.
- El owner es un usuario de `auth.users` / perfil de aplicación como cualquier otro, pero con **privilegios especiales de negocio** sobre ese POP (ver §6).

### 2.2 Usuarios permitidos en un POP

- Los usuarios asociados a un POP lo están mediante la relación **usuario ↔ POP ↔ rol** (en la doc de arquitectura: `user_pop_roles`).
- Cada vínculo debe poder **pausarse** sin borrar el registro (`is_active = false` o equivalente): el usuario **no debe poder realizar acciones** en ese POP aunque el rol siguiera teniendo permisos en papel.
- **Condición obligatoria para cualquier acceso:** existe membresía **activa** para `(user_id, pop_id)`.

### 2.3 Permisos (granularidad CRUD)

- Existe un catálogo de **permisos** atómicos: combinación **`resource` + `action`** (por ejemplo `products` + `read`, `sales` + `create`).
- **Cada operación relevante** en la aplicación debe mapearse a un par `(resource, action)` coherente; no hay “acceso genérico” sin permiso explícito salvo **owner del POP (§6)** y las excepciones del §7.
- El catálogo **no está cerrado de antemano**: se van **agregando filas en `permissions` y mapeos en código** a medida que se implementan pantallas y acciones CRUD. Al crear una feature nueva, registrar el `(resource, action)` en este doc o en un anexo cuando queramos congelar convenciones.

### 2.4 Roles por POP (`roles.pop_id`)

- La tabla **`roles`** incluye **`pop_id`** (migración: `docs/supabase/alter_roles_add_pop_id.sql`):
  - **`pop_id IS NULL`**: rol de **sistema / plantilla** (reutilizable, no pertenece a un solo POP).
  - **`pop_id` NOT NULL**: rol **custom de ese POP**; solo debe asignarse a usuarios de ese mismo POP vía `user_pop_roles`.
- Los permisos de cada rol siguen en **`role_permissions`** (sin cambio de semántica).
- Un usuario en un POP tiene **un rol asignado** en `user_pop_roles` (si en el futuro hay multi-rol, actualizar este documento).

### 2.5 Cadena de validación obligatoria

Para **toda** lectura/escritura que afecte datos scoped por `pop_id`:

1. **Usuario autenticado** (`auth.uid()` no nulo).
2. **Owner del POP (§6):** si `auth.uid() = pops.owner_user_id` para el `pop_id` de la fila → **autorizado para cualquier `(resource, action)`** en ese POP (sin consultar `role_permissions`). Opcionalmente seguir exigiendo membresía en `user_pop_roles` según implementación; si se exige, el owner debe tener fila activa o la función SQL debe reconocer owner antes de evaluar pausa.
3. Si **no** es owner: **membresía activa** en el POP — el usuario está permitido y **no** está pausado (`user_pop_roles.is_active = true`).
4. Si **no** es owner: **permiso explícito** — el rol del usuario en ese POP incluye `(resource, action)` en `role_permissions`.

Si falla cualquier eslabón aplicable → **denegar** (RLS sin filas / error de política; en servidor, no continuar la acción).

La aplicación **no debe confiar** solo en el UI: Supabase (RLS) debe hacer cumplir lo mismo cuando el cliente use el cliente anon/authenticated.

---

## 3. Dónde se aplica

| Capa | Responsabilidad |
|------|------------------|
| **RLS en Postgres** | Fuente de verdad ante cualquier query con la clave de Supabase del usuario. Políticas que usan `auth.uid()` y funciones `SECURITY DEFINER` estables. |
| **RPC / triggers** | Misma semántica: comprobar membresía activa + permiso antes de mutar datos. |
| **Server Actions / Route Handlers (Next.js)** | Validar sesión; idealmente operar con cliente que respete RLS o replicar comprobaciones críticas si usáis service role (evitar salvo jobs internos). |
| **Cliente (browser)** | Solo UX; **nunca** único control de seguridad. |

---

## 4. Convenciones de datos

- Tablas de negocio: columna **`pop_id`** NOT NULL (salvo tablas globales explícitas).
- Índices recomendados para RLS y rendimiento: `(pop_id)`, y en membresías `(user_id, pop_id)`, `(pop_id, user_id)`.
- Tabla **`roles`**: columna **`pop_id`** (ver §2.4 y script `docs/supabase/alter_roles_add_pop_id.sql`). **Pendiente aplicar en Supabase** hasta que ejecuten la migración en el proyecto.

---

## 5. Funciones SQL de apoyo (alineación con el código actual)

El proyecto ya asume RPC como:

- `user_has_pop_access(pop_id, user_id)` — acceso al POP (sin sustituir por sí solo la comprobación de permiso fino).
- `user_has_permission(pop_id, user_id, resource, action)` — **debe** incorporar internamente, en orden lógico: coherencia con `auth.uid()`; si el usuario es **`pops.owner_user_id`** de ese `pop_id` → retornar **true** para cualquier `resource`/`action`; si no, membresía **activa** en `user_pop_roles` y existencia del permiso en `role_permissions` para el rol asignado.
- `get_user_all_permissions(pop_id, user_id)` — optimización para armar mapas de UI (menú, etc.): si es **owner** del POP, puede devolver “todos los permisos conocidos” o un conjunto sentinela según implementación; el resto igual que la cadena del §2.5.

**Implementación en el repo:** `docs/supabase/rpc_user_has_permission.sql` y `docs/supabase/rpc_get_user_all_permissions.sql` (ejecutar en Supabase tras `alter_roles_add_pop_id.sql`). Orden y aclaración en `docs/supabase/README.md`.

**Requisito:** no duplicar lógica contradictoria en políticas RLS sueltas; idealmente delegar en estas funciones.

---

## 6. Owner del POP

**Decisión de producto:** el usuario **`pops.owner_user_id`** tiene **todos los permisos** sobre su POP: cualquier `(resource, action)` sobre filas con ese `pop_id` debe estar permitido en RLS/RPC que deleguen en `user_has_permission` (u homólogo).

- No hace falta que el owner tenga filas en `role_permissions` para su rol: la función SQL debe **cortocircuitar** con comprobación `user_id = (SELECT owner_user_id FROM pops WHERE id = pop_id)`.
- Recomendación: mantener al owner también en `user_pop_roles` con un rol visible en UI (opcional); la seguridad no debe depender de eso para el bypass.

---

## 7. Excepciones

### 7.1 Tablas de administración del SaaS (plataforma)

- Tablas **sin** `pop_id` o con ámbito global (facturación interna, feature flags globales, soporte, etc.).
- **No** usar las políticas “por POP” aquí.
- Acceso típico: rol **`service_role`** solo en backend, y/o flag **`is_platform_admin`** (JWT claim o tabla de admins) con políticas RLS dedicadas **separadas** de las de tenant.
- Principio: **mínimo privilegio**; nunca exponer service role al cliente.

### 7.2 Perfil de usuario / datos “propios”

- Tabla(s) de perfil (p. ej. datos editables del usuario): reglas **distintas** al tenant.
- **Solo el usuario dueño del perfil** puede actualizar sus campos permitidos: `auth.uid() = user_id` (o join equivalente).
- Campos sensibles o de solo lectura (email verificado, límites de plan, etc.) solo vía **admin** o triggers, no editables por el propio usuario.

### 7.3 Lecturas públicas o catálogos

Si existen (p. ej. planes de suscripción públicos), deben listarse en este documento o en un anexo; por defecto **todo lo que lleve `pop_id` es privado al POP**.

---

## 8. Checklist al añadir una tabla nueva

- [ ] ¿Lleva `pop_id`? Si sí → políticas RLS con la cadena §2.5 (incl. owner §6).
- [ ] ¿Qué `(resource, action)` corresponde a SELECT/INSERT/UPDATE/DELETE? → dar de alta en `permissions` + `role_permissions` según roles que deban usarlo; documentar en comentario o anexo si hace falta.
- [ ] ¿Los índices soportan el `WHERE pop_id = …` y las subconsultas de membresía?
- [ ] ¿`user_has_permission` y `get_user_all_permissions` ya contemplan **owner = todo** (§5–§6)?
- [ ] ¿Server action usa cliente con sesión de usuario (RLS activo) y no service role salvo job interno?

---

## 9. Referencias en el repo

- Arquitectura multi-tenant y ejemplo de RLS: `docs/multi-tenant-architecture.md`.
- Comprobaciones de menú en servidor: `src/lib/menuPermissionsServer.ts`, `src/lib/menuPermissions.ts`.

---

## 10. Evolución

- **Permisos:** no hay lista inicial cerrada; se incorporan **`permissions` + uso en código** junto con cada feature CRUD. Cuando el catálogo sea estable, se puede extraer un anexo “matriz resource/action”.
- **Migración pendiente en Supabase:** agregar **`roles.pop_id`** con el script `docs/supabase/alter_roles_add_pop_id.sql` y actualizar RLS/RPC que asuman solo roles globales.
