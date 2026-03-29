# Guía para nuevas tablas, pantallas y flujos (Rootsy)

**Etapa 3:** leer antes de implementar features o al escribir prompts para el asistente. Complementa `SECURITY_OVERVIEW_SIMPLE.md` y `SECURITY_ACTION_PLAN.md`.

---

## 1. Datos multi-tenant (POP)

- Toda tabla de negocio que pertenezca a un cliente debe tener **`pop_id`** (o relación inequívoca a un POP).
- **Nunca** confiar solo en el front para filtrar por POP.

---

## 2. Autorización: tres capas

| Capa | Qué hacer |
|------|-----------|
| **Base (RLS)** | Políticas `USING` / `WITH CHECK` que restrinjan filas al POP y, si aplica, a `user_has_permission`. |
| **RPC `SECURITY DEFINER`** | Validar `auth.uid()`, `pop_id` y permisos **dentro** de la función. |
| **App (Next)** | Una **pegada** de permisos por pantalla POP cuando haga falta UI: `loadPopPermissionsSnapshot` → `permissionKeys` o flags derivados. |

Mutaciones desde server actions: **cliente Supabase con sesión del usuario** (no `service_role` para acciones de usuario final).

---

## 3. Patrón de código en `rootsy-core` (Etapa 1)

### Constantes de permiso

- Archivo: `src/lib/popPermissionConstants.ts`
- Añadí pares nuevos como `POP_PERMS.MI_RECURSO = { resource: '…', action: '…' }` **alineados** con filas en `public.permissions` y con `menuPermissions.ts` si el ítem tiene entrada de menú.

### Cargar permisos del usuario en un POP (una vez)

- Archivo: `src/lib/popPermissionsServer.ts`
- Función: `loadPopPermissionsSnapshot(popId)` → `{ keys: string[] }` con claves `resource:action`.
- En la server action de la página: llamar **una vez** y derivar qué mostrar; usar `permissionKeysInclude(keys, resource, action)` o `permissionKeysIncludeDef(keys, POP_PERMS.X)`.

### Menú lateral

- `getMenuPermissions` ya reutiliza `loadPopPermissionsSnapshot` + `menuPermissions.ts`. Si agregás un ítem de menú, mapeá su `label` a `{ resource, action }` ahí.

### Pantallas `[pop]` cubiertas (patrón aplicado)

| Ruta / acción | Permiso de entrada (`POP_PERMS`) | Notas |
|---------------|----------------------------------|--------|
| `menu` — `getPopMenuData` | Ninguno extra (solo `validatePopAccess`) | Un solo `get_user_all_permissions` por carga; devuelve `permissionKeys`. |
| `hr` — `getPopHrDashboard` | `HR_READ` (`hr:read`) | Devuelve `permissionKeys`. |
| `settings` — `getPopSettingsForEdit` | `SETTINGS_READ` | `canUpdate` = `SETTINGS_UPDATE` en el mismo snapshot. |
| `settings` — `updatePopSettings` | `SETTINGS_UPDATE` | Sin RPC extra de `user_has_permission`. |
| `sale` — categorías / productos | `SALE_READ` (`sale:read`, entrada a Ventas) | Lectura de `categories` / `articles`: **solo RLS**. Ver `PERMISSIONS_SCREENS_AND_RLS.md`. |

Otras rutas (`/pops/[popId]/subscribe`, perfil, home) no usan este helper: tienen reglas propias.

### Ejemplo aplicado

- RRHH: `getPopHrDashboard` exige `POP_PERMS.HR_READ` y devuelve `permissionKeys` en la respuesta para quien quiera granularidad en el cliente sin otra RPC.

---

## 4. Checklist al agregar una tabla nueva

- [ ] Columna `pop_id` donde corresponda + FK a `pops`.
- [ ] `ENABLE ROW LEVEL SECURITY`.
- [ ] Políticas para **SELECT / INSERT / UPDATE / DELETE** que usen acceso al POP (p. ej. `user_has_pop_access(pop_id, auth.uid())`) y permisos finos si aplica (`user_has_permission`).
- [ ] **INSERT/UPDATE:** `WITH CHECK` que el `pop_id` de la fila nueva sea accesible (evita insertar en otro POP).
- [ ] Si usás **RPC DEFINER** para mutar: documentar y revisar validaciones en la función.
- [ ] Actualizar **`docs/DATABASE_RLS_RPC_INVENTORY.md`** (o el SQL de inventario) cuando despliegues.

---

## 5. Checklist al agregar una pantalla POP

- [ ] Server action de carga: `validatePopAccess` + `loadPopPermissionsSnapshot` si la UI depende de permisos.
- [ ] Comprobar permiso de **entrada** a la ruta (ej. `POP_PERMS.*`) antes de devolver datos sensibles.
- [ ] UI: ocultar acciones según `permissionKeys` (comodidad); **la seguridad real sigue en RLS/RPC**.

---

## 6. Prompts para IA (copiar al contexto)

> Al crear una tabla, pantalla o flujo en `rootsy-core` que toque datos por `pop_id`: seguir `docs/FEATURE_DEVELOPMENT_GUIDE.md`, usar `loadPopPermissionsSnapshot` + `POP_PERMS`, no usar `service_role` en acciones de usuario, y definir o extender RLS en Supabase alineada con `user_has_permission` donde corresponda. Las RPC `SECURITY DEFINER` deben validar `auth.uid()` y permisos explícitamente.

---

## 7. Referencias

- `docs/SECURITY_OVERVIEW_SIMPLE.md` — explicación en lenguaje simple.
- `docs/SECURITY_ACTION_PLAN.md` — fases y principios.
- `docs/PERMISSIONS_SCREENS_AND_RLS.md` — permisos por pantalla vs RLS por tabla.
- `docs/DATABASE_RLS_RPC_INVENTORY.md` — estado de RLS y RPC.
- `docs/supabase-access-security.md` — modelo de negocio detallado.
