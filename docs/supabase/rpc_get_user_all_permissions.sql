-- =============================================================================
-- get_user_all_permissions — usada por getMenuPermissions (menuPermissionsServer.ts)
-- =============================================================================
-- Debe devolver filas { resource, action } para armar el Set en el servidor.
-- Owner del POP: todas las filas actuales de public.permissions.
-- Resto: permisos del rol activo, con rol válido (roles.pop_id NULL o = pop).
--
-- Si ya existía con otros nombres de parámetros, Postgres no permite solo
-- CREATE OR REPLACE: hay que DROP antes (CASCADE si hay dependencias).
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_user_all_permissions(UUID, UUID) CASCADE;

CREATE FUNCTION public.get_user_all_permissions(
  p_pop_id UUID,
  p_user_id UUID
)
RETURNS TABLE(resource TEXT, action TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.pops o
    WHERE o.id = p_pop_id AND o.owner_user_id = p_user_id
  ) THEN
    RETURN QUERY
    SELECT p.resource::TEXT, p.action::TEXT
    FROM public.permissions p;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT p.resource::TEXT, p.action::TEXT
  FROM public.user_pop_roles upr
  JOIN public.roles r ON r.id = upr.role_id
    AND (r.pop_id IS NULL OR r.pop_id = upr.pop_id)
  JOIN public.role_permissions rp ON rp.role_id = upr.role_id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE upr.pop_id = p_pop_id
    AND upr.user_id = p_user_id
    AND upr.is_active = true;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_all_permissions(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_all_permissions(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_all_permissions(UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.get_user_all_permissions(UUID, UUID) IS
  'Lista resource/action: owner = catálogo completo; otros = vía rol activo y roles.pop_id.';
