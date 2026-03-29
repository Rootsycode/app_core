# SQL de referencia (Supabase)

Orden sugerido al aplicar cambios de permisos y roles:

1. **`permissions_pop_screens_crud.sql`** — catálogo `public.permissions` alineado a pantallas `menu` / `sale` / `settings` / `hr` × CRUD (ejecutar en staging primero; reasignar `role_permissions` a los roles que no sean owner).
2. **`alter_roles_add_pop_id.sql`** — agrega `roles.pop_id`.
3. **`rpc_user_has_permission.sql`** — define o actualiza la función que usa RLS y `menuPermissions` / servidor.
4. **`rpc_get_user_all_permissions.sql`** — define o actualiza la función que usa el menú (`getMenuPermissions`).
5. **`rls_users_select_pop_owner.sql`** — permite ver datos básicos del dueño del POP a quien tiene `user_has_pop_access` (complementa la política de compañeros en el mismo POP).

### Migración ya aplicada vía MCP (2026)

En el proyecto vinculado a Cursor se aplicó la migración `rootsy_roles_pop_id_and_permission_rpcs_v2` (columna `roles.pop_id`, funciones `user_has_permission` y `get_user_all_permissions`). Si reejecutás el SQL a mano y falla `get_user_all_permissions` por nombres de parámetros, usá el `DROP FUNCTION` del archivo `rpc_get_user_all_permissions.sql`.

### ¿Qué significa “ajustar `user_has_permission`”?

No es un cambio en el código TypeScript: la app ya hace `supabase.rpc('user_has_permission', { ... })`.

“Ajustar” significa **cambiar la función almacenada en Postgres** (en el dashboard de Supabase: **SQL** → nuevo query → pegar el contenido de `rpc_user_has_permission.sql` → ejecutar). Así el motor aplica la regla del **owner con todos los permisos** y la validación de **`roles.pop_id`**.

Si no ejecutás ese script, la función vieja (solo `user_pop_roles` + `role_permissions`) seguirá corriendo y el **owner podría quedar sin permisos** en pantallas que dependan del RPC.
