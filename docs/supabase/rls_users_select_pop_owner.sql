DROP POLICY IF EXISTS "Users can view owners of POPs they access" ON public.users;

CREATE POLICY "Users can view owners of POPs they access"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.pops p
    WHERE p.owner_user_id = users.id
      AND public.user_has_pop_access(p.id, auth.uid())
  )
);
