-- Invitaciones HR sin service role en Next.js.
-- Ejecutar en Supabase SQL Editor (o como migración) si aún no está aplicado.
--
-- Seguridad: accept_pop_invitation solo completa la invitación si el correo de
-- auth.users (sesión actual) coincide con pop_invitations.email (normalizado).

CREATE OR REPLACE FUNCTION public.lookup_auth_user_id_for_pop_owner_invite (
  p_pop_id uuid,
  p_email text
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE lower(trim(u.email)) = lower(trim(p_email))
    AND EXISTS (
      SELECT 1
      FROM public.pops p
      WHERE p.id = p_pop_id
        AND p.owner_user_id = auth.uid()
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_auth_user_id_for_pop_owner_invite (uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_auth_user_id_for_pop_owner_invite (uuid, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.accept_pop_invitation (p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.pop_invitations%ROWTYPE;
  auth_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT lower(trim(email)) INTO auth_email
  FROM auth.users
  WHERE id = auth.uid();

  IF auth_email IS NULL OR auth_email = '' THEN
    RETURN json_build_object('ok', false, 'error', 'no_email');
  END IF;

  SELECT * INTO inv
  FROM public.pop_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF lower(trim(inv.email)) IS DISTINCT FROM auth_email THEN
    RETURN json_build_object('ok', false, 'error', 'wrong_email');
  END IF;

  INSERT INTO public.user_pop_roles (user_id, pop_id, role_id, is_active, invited_at, updated_at)
  VALUES (auth.uid(), inv.pop_id, inv.role_id, true, now(), now())
  ON CONFLICT (user_id, pop_id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    is_active = true,
    invited_at = COALESCE(public.user_pop_roles.invited_at, EXCLUDED.invited_at),
    updated_at = now();

  UPDATE public.pop_invitations
  SET status = 'accepted'
  WHERE id = inv.id;

  RETURN json_build_object('ok', true, 'pop_id', inv.pop_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_pop_invitation (text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_pop_invitation (text) TO authenticated;
