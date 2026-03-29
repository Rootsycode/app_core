-- RRHH: dueño del POP elimina roles del POP y sincroniza role_permissions.
-- RLS solo permite SELECT en roles/role_permissions; las mutaciones pasan por estas RPC SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.hr_pop_owner_delete_pop_role (p_pop_id uuid, p_role_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.roles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.pops WHERE id = p_pop_id AND owner_user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  SELECT * INTO r FROM public.roles WHERE id = p_role_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF r.pop_id IS NULL OR r.pop_id IS DISTINCT FROM p_pop_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_role');
  END IF;
  IF r.name = 'owner' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_delete_owner');
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_pop_roles
    WHERE pop_id = p_pop_id AND role_id = p_role_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'role_in_use');
  END IF;
  DELETE FROM public.roles WHERE id = p_role_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.hr_pop_owner_delete_pop_role (uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hr_pop_owner_delete_pop_role (uuid, uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.hr_pop_owner_sync_role_permissions (
  p_pop_id uuid,
  p_role_id uuid,
  p_permission_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.roles%ROWTYPE;
  bad_cnt int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.pops WHERE id = p_pop_id AND owner_user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  SELECT * INTO r FROM public.roles WHERE id = p_role_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF r.pop_id IS NULL OR r.pop_id IS DISTINCT FROM p_pop_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_role');
  END IF;

  SELECT COUNT(*) INTO bad_cnt
  FROM unnest(COALESCE(p_permission_ids, ARRAY[]::uuid[])) AS pid(perm_id)
  WHERE NOT EXISTS (SELECT 1 FROM public.permissions p WHERE p.id = pid.perm_id);

  IF bad_cnt > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_permission');
  END IF;

  DELETE FROM public.role_permissions WHERE role_id = p_role_id;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT DISTINCT p_role_id, perm_id
  FROM unnest(COALESCE(p_permission_ids, ARRAY[]::uuid[])) AS pid(perm_id);

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.hr_pop_owner_sync_role_permissions (uuid, uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hr_pop_owner_sync_role_permissions (uuid, uuid, uuid[]) TO authenticated;
