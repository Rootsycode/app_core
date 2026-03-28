-- La app (Next.js) ya NO depende de esta función: activa la suscripción con UPDATE vía cliente
-- autenticado (ver simulateActivatePopSubscription en subscribe/actions.ts).
--
-- Si esos UPDATE fallan por RLS, opción A) ejecutá las políticas de ejemplo abajo, o
-- opción B) creá esta función RPC (evita problemas de RLS si corre como SECURITY DEFINER).
--
-- ---------------------------------------------------------------------------
-- Políticas RLS de ejemplo (solo si hace falta; ajustá nombres si ya existen)
-- ---------------------------------------------------------------------------
-- CREATE POLICY "owner_updates_pop_subscription"
-- ON public.pop_subscriptions FOR UPDATE TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.pops p
--     WHERE p.id = pop_subscriptions.pop_id AND p.owner_user_id = auth.uid()
--   )
-- );
--
-- CREATE POLICY "owner_updates_own_pop"
-- ON public.pops FOR UPDATE TO authenticated
-- USING (owner_user_id = auth.uid())
-- WITH CHECK (owner_user_id = auth.uid());
-- ---------------------------------------------------------------------------

-- RPC opcional (pago simulado sin depender de políticas UPDATE en tablas)
-- Simula un pago exitoso: deja la suscripción en `active`, renueva el período y reactiva el POP.

CREATE OR REPLACE FUNCTION public.simulate_activate_pop_subscription(p_pop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_owner uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT owner_user_id INTO v_owner
  FROM public.pops
  WHERE id = p_pop_id;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'pop_not_found');
  END IF;

  IF v_owner <> v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.pop_subscriptions WHERE pop_id = p_pop_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_subscription');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.subscription_plans
    WHERE is_active AND name IN ('started', 'starter')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_paid_plan');
  END IF;

  -- Plan de pago: prioridad `started`, si no existe `starter` (misma lógica que subscribe/actions.ts)
  UPDATE public.pop_subscriptions ps
  SET
    plan_id = sp.id,
    status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '30 days',
    price_monthly = COALESCE(sp.base_price_monthly, 0),
    price_yearly = sp.base_price_yearly
  FROM (
    SELECT id, base_price_monthly, base_price_yearly
    FROM public.subscription_plans
    WHERE is_active AND name IN ('started', 'starter')
    ORDER BY CASE name WHEN 'started' THEN 0 ELSE 1 END
    LIMIT 1
  ) sp
  WHERE ps.pop_id = p_pop_id;
  -- Si tu tabla tiene updated_at, agregá: , updated_at = now()

  UPDATE public.pops
  SET is_active = true
  WHERE id = p_pop_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.simulate_activate_pop_subscription(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.simulate_activate_pop_subscription(uuid) TO authenticated;

COMMENT ON FUNCTION public.simulate_activate_pop_subscription(uuid) IS
  'Dev/demo: marca suscripción como activa y reactiva el POP sin pasarela de pago.';

-- PostgREST (API) cache: sin esto a veces aparece
-- "Could not find the function ... in the schema cache" hasta que pase tiempo o reinicies.
NOTIFY pgrst, 'reload schema';

-- Verificación (opcional, misma consola SQL):
-- SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname = 'simulate_activate_pop_subscription';
