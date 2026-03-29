# Plan de acción: patrones de seguridad multi-tenant (Rootsy)

Objetivo: **reglas claras y repetibles** para todos los flujos del SaaS, con **el mínimo de idas a base razonable**, sin sacrificar la frontera de seguridad en Postgres.

---

## 1. Principios (acordados)

1. **Fuente de verdad de permisos:** tabla `permissions` + `role_permissions` + membresía activa `user_pop_roles`, con **atajo de owner** (`pops.owner_user_id`) ya modelado en `user_has_permission` (ver `docs/supabase/rpc_user_has_permission.sql`).
2. **No duplicar en TypeScript el atajo de owner** si ya delegás en `user_has_permission` (evita dos verdades para lo mismo).
3. **Ámbito POP:** las reglas de este plan aplican a acciones ligadas a un `pop_id`. Flujos globales (perfil, home sin POP, crear POP) siguen sus propios patrones; no forzar el mismo helper.
4. **RLS obligatorio** en tablas expuestas al cliente autenticado; las server actions que usan el cliente con **sesión del usuario** heredan esas políticas.
5. **`SECURITY DEFINER`:** la autorización vive **dentro de la función**; RLS de la tabla no sustituye la revisión en la RPC.

---

## 2. Capas y responsabilidad

| Capa | Rol | Coste típico |
|------|-----|----------------|
| **UI (páginas/cliente)** | Mostrar u ocultar según permisos ya obtenidos (UX); **no** es seguridad por sí sola. | 0 pegadas extra si vienen del mismo payload de la página. |
| **Server (loaders / una acción “get data”)** | Armar DTO + **un** set de permisos para la vista (ver §3). | Acotado a 1–2 RPC/query por request de página. |
| **Server (mutación)** | Llamar Supabase (insert/update/delete/rpc) con **cliente de usuario**; confiar en RLS + contrato de RPC. | 1 round-trip por mutación (inevitable). |
| **Postgres RLS** | Autorización real ante cualquier query con JWT de usuario. | Incluido en cada query; diseñar políticas que reutilicen `user_has_permission` donde sea posible. |
| **RPC DEFINER** | Donde RLS no alcanza o hace falta transacción; debe llamar a la **misma semántica** (`user_has_permission` o helper SQL único). | 1 RPC por operación atómica compleja. |

---

## 3. Patrón de bajo coste: permisos en la carga de pantalla

**Problema:** llamar `user_has_permission` por cada botón o cada server action multiplica pegadas.

**Patrón recomendado:**

1. Al cargar una pantalla de POP (layout, page server component o una server action tipo `getPopXxxData`), obtener **una vez**:
   - datos del dominio necesarios;
   - **mapa de permisos** vía `get_user_all_permissions(pop_id, user_id)` (ya usado en menú — mismo concepto).
2. Derivar en servidor o pasar al cliente un objeto serializable, p. ej. `Set("resource:action")` o `Record<string, boolean>` para los permisos que la pantalla necesita.
3. La UI solo **lee** ese objeto; no hace una pegada por permiso.

**Cuándo sí hacer una comprobación extra en servidor (mutación):**

- Si la mutación **no** puede expresarse bien en RLS y pasa por RPC: la RPC ya concentra el coste (una pegada).
- Si necesitás **reglas de negocio** que no están en RLS (p. ej. validaciones complejas): preferir **una RPC** que encapsule todo antes de multiplicar round-trips desde TS.

---

## 4. Patrón de mutación (server actions)

1. `requireAuthenticatedUser()` (o equivalente) si hace falta sesión explícita.
2. Usar **`createClient()` / cliente con cookies** del usuario — **nunca** `service_role` para acciones iniciadas por usuario.
3. Ejecutar la operación (`.insert`, `.update`, `.delete`, `.rpc`).
4. Mapear errores de Postgres/PostgREST a mensajes UX si hace falta (opcional, no duplica autorización).

**No** añadir en TS una segunda matriz de permisos si RLS + RPC ya cubren el caso (salvo el §6).

---

## 5. RPC `SECURITY DEFINER` (checklist)

Para cada RPC existente o nueva:

- [ ] ¿Quién puede ejecutarla? → `GRANT EXECUTE` solo a `authenticated` (o rol acotado).
- [ ] ¿Valida `auth.uid()` y pertenencia al POP (y POP activo si aplica)?
- [ ] ¿Usa `user_has_permission(pop_id, auth.uid(), resource, action)` para acciones no-owner, alineado con el producto?
- [ ] ¿Evita confiar en parámetros que el cliente pueda falsificar (p. ej. `pop_id` debe cruzarse con filas que el usuario puede tocar)?

---

## 6. Reglas que hoy pueden estar solo en app (migrar a Postgres)

Revisar y, a medio plazo, **duplicar en RLS o en RPC** (no solo en TS):

- POP **inactivo** / suscripción (hoy `validatePopAccess` + `isPopActive`).
- Cualquier “solo owner” hardcodeado en actions que deba pasar a **permiso explícito** o a política común.

Hasta que eso esté en DB, **mantener** el chequeo mínimo en la ruta que lo garantice hoy (no eliminar sin sustituto en Postgres).

---

## 7. Fases de trabajo sugeridas

### Fase A — Inventario (bajo coste, alto valor)

- Listar **todas** las server actions y rutas API que tocan datos por `pop_id`.
- Por cada una: **tabla/RPC**, ¿cliente usuario o service role?, ¿RLS aplica?
- Marcar RPCs `SECURITY DEFINER` y revisar cuerpo vs permisos deseados.

### Fase B — Catálogo de permisos

- Mantener lista única de pares `(resource, action)` alineados con `permissions` y con `menuPermissions.ts`.
- Documentar qué permiso corresponde a cada flujo sensible (RRHH, ajustes, ventas, etc.).

### Fase C — RLS alineada

- Por tabla expuesta: políticas que usen `user_has_pop_access` + `user_has_permission` donde corresponda (mismo criterio que negocio).
- Ajustar políticas actuales que sean solo “owner” si el producto pide delegación (p. ej. `pop_invitations`).

### Fase D — UI

- Pantallas POP: payload inicial incluye permisos necesarios; componentes reciben props o contexto de solo lectura.
- Evitar N llamadas `checkUserPermission` por interacción; preferir el set calculado en Fase B del load.

### Fase E — Auditoría y deuda

- Buscar `service_role` en código de usuario final.
- Tests manuales: usuario sin permiso + llamada directa a server action / API.

---

## 8. Cuándo aceptar coste extra

| Situación | Incluir |
|-----------|---------|
| Operación sensible (pagos, borrado masivo, cambio de roles) | RPC transaccional o política RLS explícita aunque sea más verbosa |
| Una pegada más en **carga de página** para evitar 10 en interacciones | Sí |
| Duplicar owner check en TS y en SQL | No (una fuente: SQL) |
| UI sola sin RLS | Nunca como única defensa |

---

## 9. Referencias en repo

- `docs/supabase-access-security.md`
- `docs/supabase/rpc_user_has_permission.sql`
- `docs/supabase/rpc_get_user_all_permissions.sql`
- `src/lib/menuPermissionsServer.ts` / `src/lib/menuPermissions.ts`
- `src/lib/popHelpers.ts` (`validatePopAccess`)

---

*Última actualización: plan acordado en conversación de producto; ejecutar fases y tachar ítems según avance el proyecto.*
