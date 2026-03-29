# Inventario: tablas RLS y RPC (Supabase público)

Documento de **Etapa 2**: checklist de políticas por tabla y listado de funciones RPC.  
**Proyecto:** el vinculado al MCP al momento de generar este archivo (marzo 2026). Si tenés otro entorno, re-ejecutá las consultas en el SQL Editor.

---

## Qué es RLS

**Row Level Security:** reglas en Postgres que se aplican **en cada consulta** con el usuario autenticado (`auth.uid()`). Si el cliente usa la **anon key** con JWT de usuario, **no puede saltarse** RLS sin bugs o sin usar `service_role`.

---

## Qué es una RPC (función expuesta por Supabase)

Es una **función almacenada** en Postgres que la API de Supabase expone como `supabase.rpc('nombre', { ... })`.

- **`SECURITY INVOKER`:** corre con los permisos del usuario que llama; **RLS aplica** a los `SELECT`/`INSERT` dentro de la función como si fueran del usuario.
- **`SECURITY DEFINER`:** corre con permisos del **dueño** de la función (suele ser elevado). **RLS puede no aplicarse** igual que en una query directa del usuario. Por eso **la función debe validar** explícitamente: ¿este `auth.uid()` puede hacer esto sobre este `pop_id`?

**Acción recomendada para DEFINER:** revisar el cuerpo y alinear con `user_has_permission` / membresía / owner según el producto (ver columna *Notas* abajo).

---

## Tablas `public` con RLS activo

| Tabla | RLS |
|-------|-----|
| accounting_entries | sí |
| accounting_entry_lines | sí |
| articles | sí |
| business_types | sí |
| categories | sí |
| chart_of_accounts | sí |
| permissions | sí |
| pop_invitations | sí |
| pop_subscription_features | sí |
| pop_subscriptions | sí |
| pops | sí |
| role_permissions | sí |
| roles | sí |
| subscription_features | sí |
| subscription_plans | sí |
| user_pop_roles | sí |
| users | sí |

---

## Políticas por tabla (resumen)

> Los nombres exactos vienen de `pg_policies`. **Revisá el SQL en Supabase** para el `USING` / `WITH CHECK` completos.

| Tabla | Comandos cubiertos | Resumen |
|-------|-------------------|---------|
| accounting_entries | SELECT, INSERT, UPDATE | Acceso por POP |
| accounting_entry_lines | SELECT, INSERT, UPDATE | Acceso por POP |
| articles | SELECT, INSERT, UPDATE, DELETE | Políticas `articles_*` |
| business_types | SELECT | Lectura pública de tipos activos |
| categories | SELECT, INSERT, UPDATE, DELETE | Políticas `categories_*` |
| chart_of_accounts | SELECT, INSERT, UPDATE | Acceso por POP |
| permissions | SELECT | Todos pueden leer catálogo |
| pop_invitations | ALL | **Solo owner** del POP (nombre de política: Owners manage…) |
| pop_subscription_features | SELECT, ALL (owner) | Owner gestiona; usuarios ven las suyas |
| pop_subscriptions | SELECT, ALL (owner) | Idem |
| pops | SELECT, INSERT, UPDATE, DELETE | Varias políticas (acceso, owner, update con `user_has_permission` para `pops`/`update`) |
| role_permissions | SELECT | Solo lectura; escritura vía RPC HR |
| roles | SELECT | Solo lectura; escritura acotada / RPC |
| subscription_features | SELECT | Catálogo |
| subscription_plans | SELECT | Catálogo |
| user_pop_roles | SELECT, ALL | Ver propias / owner o `user_has_permission` users create/update |
| users | SELECT, INSERT, UPDATE | Perfil propio + perfiles en POPs según políticas |

### Huecos conocidos a trackear (producto)

- **`pop_invitations`:** hoy **solo owner**. Si el producto delega invitaciones a roles con permiso `hr` o `users`, hay que **ampliar la política** o mover escritura solo a RPC que valide permiso.
- **`roles` / `role_permissions`:** sin INSERT/UPDATE por RLS para usuarios; mutaciones vía **`hr_pop_owner_*`** RPC (hoy validan owner; alinear con permisos si aplica).

---

## Funciones en `public` (RPC relevantes)

| Función | Argumentos | Seguridad | Rol típico |
|---------|------------|-----------|------------|
| user_has_permission | `(pop_id, user_id, resource, action)` y sobrecarga sin `user_id` | DEFINER | ¿Tiene permiso fino en el POP? (owner = sí) |
| user_has_pop_access | `(pop_id, user_id)` / `(pop_id)` | DEFINER | ¿Membresía activa al POP? |
| get_user_all_permissions | `(p_pop_id, p_user_id)` | DEFINER | Lista `resource/action` para UI (menú, snapshot) |
| get_user_accessible_pops | `()` / `(user_id)` | DEFINER | Lista POPs del usuario |
| get_user_pop_role | variantes | DEFINER | Rol actual en POP |
| get_user_pop_role_name | variantes | DEFINER | Nombre de rol |
| is_pop_active | `(pop_id)` | DEFINER | POP activo / trial |
| get_pop_subscription_info | `(pop_id)` | DEFINER | Info suscripción |
| get_trial_days_remaining | `(pop_id)` | DEFINER | Días de prueba |
| can_user_create_pop | `(user_id)` | DEFINER | Puede crear POP |
| accept_pop_invitation | `(p_token)` | DEFINER | Aceptar invitación (valida email) |
| lookup_auth_user_id_for_pop_owner_invite | `(p_pop_id, p_email)` | DEFINER | Owner busca usuario por email |
| hr_pop_owner_delete_pop_role | `(p_pop_id, p_role_id)` | DEFINER | Borrar rol del POP |
| hr_pop_owner_sync_role_permissions | `(p_pop_id, p_role_id, p_permission_ids)` | DEFINER | Guardar permisos del rol |
| create_default_chart_of_accounts / create_pop_chart_of_accounts | — | DEFINER | Onboarding contable |
| get_account_by_code / get_next_entry_number / get_income_statement / get_trial_balance / validate_entry_balanced / check_entry_balance | — | DEFINER | Contabilidad por POP |
| assign_owner_role_on_pop_creation | trigger-like | DEFINER | Asigna rol al crear POP |
| handle_new_user | — | DEFINER | Trigger auth |
| create_trial_subscription | — | DEFINER | Trial |
| update_updated_at_column | — | INVOKER | Trigger updated_at |

---

## Cómo actualizar este inventario

En **SQL Editor**:

```sql
-- Tablas con RLS
SELECT relname, relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND relkind = 'r'
ORDER BY 1;

-- Políticas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- RPC públicas
SELECT p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f'
ORDER BY 1;
```

---

*Generado como parte del plan de seguridad Rootsy; mantener vivo al cambiar políticas o funciones.*
