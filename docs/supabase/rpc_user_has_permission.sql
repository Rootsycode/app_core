-- =============================================================================
-- user_has_permission — lógica acordada para Rootsy
-- =============================================================================
-- Qué es esto: en Supabase, las políticas RLS y el cliente llaman a la FUNCIÓN
-- RPC `user_has_permission(pop_id, user_id, resource, action)` (ver
-- menuPermissionsServer.ts). "Ajustarla" = sustituir su definición en Postgres
-- por esta versión (SQL Editor → pegar → Run), para que:
--   1) El owner del POP (pops.owner_user_id) tenga SIEMPRE permiso (true).
--   2) El resto: membresía activa en user_pop_roles + fila en role_permissions.
--   3) El rol asignado sea válido para ese POP: roles.pop_id IS NULL o = pop_id.
--
-- Requisito previo: columna roles.pop_id (alter_roles_add_pop_id.sql).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_has_permission(
  pop_id UUID,
  user_id UUID,
  resource TEXT,
  action TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.pops o
      WHERE o.id = user_has_permission.pop_id
        AND o.owner_user_id = user_has_permission.user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_pop_roles upr
      JOIN public.roles r ON r.id = upr.role_id
        AND (r.pop_id IS NULL OR r.pop_id = upr.pop_id)
      JOIN public.role_permissions rp ON rp.role_id = upr.role_id
      JOIN public.permissions p ON p.id = rp.permission_id
      WHERE upr.pop_id = user_has_permission.pop_id
        AND upr.user_id = user_has_permission.user_id
        AND upr.is_active = true
        AND p.resource = user_has_permission.resource
        AND p.action = user_has_permission.action
    );
$$;

REVOKE ALL ON FUNCTION public.user_has_permission(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_permission(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(UUID, UUID, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.user_has_permission(UUID, UUID, TEXT, TEXT) IS
  'Owner del POP: siempre true. Otros: user_pop_roles activo + role_permissions + rol válido (pop_id).';
