# Permisos por pantalla vs RLS por tabla

Decisión de producto (Rootsy):

## Regla

1. **Permisos de aplicación (menú, snapshot, gates de server actions)**  
   Se definen **por pantalla** bajo `[pop]` con CRUD en catálogo `permissions`: `menu`, `sale`, `settings`, `hr` × `read|create|update|delete`. Entrada típica a **Ventas**: `sale:read`.

2. **RLS en Postgres**  
   Se define **por tabla** (y por operación: `SELECT`, `INSERT`, etc.).  
   Ej.: leer filas de `categories` lo define **RLS** en esa tabla; el permiso de app `sale:read` solo cubre la **pantalla** Ventas.

3. **Pantallas que leen varias tablas**  
   El usuario puede tener **`sale:read`** y entrar a Ventas, pero si **no** tiene permiso de lectura según RLS en `articles` / `categories`, las queries fallan o devuelven vacío.  
   **Es el comportamiento esperado.** La UI debe explicar que faltan permisos sobre las pantallas/recursos de esas tablas.

## Ejemplo: Ventas

| Capa | Qué comprueba |
|------|----------------|
| Entrada a la ruta / menú “Vender” | `sale:read` (`POP_PERMS.SALE_READ`, `menuPermissions.ts`). |
| `SELECT` en `categories` | RLS con `user_has_permission(..., 'categories', 'read')` (o el par que definan para “pantalla categorías”). |
| `SELECT` en `articles` | RLS con `user_has_permission(..., 'articles', 'read')` (o equivalente). |

## Catálogo `permissions`

Debe existir la fila `(sales, read)` para que los roles puedan recibir ese permiso. Si antes solo existía `sales:create` para cajeros, migrar roles o añadir ambas filas según negocio.

Script opcional (idempotente aproximado):

```sql
INSERT INTO public.permissions (resource, action, description)
VALUES ('sales', 'read', 'Ver pantalla de ventas')
ON CONFLICT (resource, action) DO NOTHING;
```

(Ajustar si `UNIQUE` no es `(resource, action)` en tu esquema.)

## Código

- `src/lib/popPermissionConstants.ts` — `POP_PERMS` (pantallas `menu` \| `sale` \| `settings` \| `hr` × CRUD)
- `docs/supabase/permissions_pop_screens_crud.sql` — migración del catálogo en `public.permissions`
- `src/app/[pop]/sale/actions.ts` — gate de pantalla + mensaje `SALE_CATALOG_RLS_DENIED_MESSAGE` ante fallos típicos de RLS
