'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from '@/lib/authHelpers'
import { getPopSubscriptionInfo } from '@/lib/subscriptions'

/** Orden: primero el plan que pediste; si no hay fila en DB, probamos `starter` (nombre del doc). */
const PAID_PLAN_CANDIDATES = ['started', 'starter'] as const

export type SubscribePageData =
  | {
      ok: true
      popId: string
      popName: string
      subscription: Record<string, unknown> | null
    }
  | { ok: false; error: string }

export async function getSubscribePageData (popId: string): Promise<SubscribePageData> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data: hasAccess, error: accessError } = await supabase.rpc(
      'user_has_pop_access',
      { pop_id: popId, user_id: user.uid }
    )

    if (accessError || !hasAccess) {
      return { ok: false, error: 'No tenés acceso a este punto de venta.' }
    }

    const { data: pop, error: popError } = await supabase
      .from('pops')
      .select('id, name, owner_user_id')
      .eq('id', popId)
      .single()

    if (popError || !pop) {
      return { ok: false, error: 'No se encontró el punto de venta.' }
    }

    if (pop.owner_user_id !== user.uid) {
      return {
        ok: false,
        error: 'Solo el titular del punto de venta puede activar la suscripción.'
      }
    }

    const subscription = await getPopSubscriptionInfo(popId)

    return {
      ok: true,
      popId: pop.id,
      popName: pop.name,
      subscription: subscription as Record<string, unknown> | null
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { ok: false, error: message }
  }
}

export type SimulatePayResult =
  | { success: true }
  | { success: false; error: string }

export async function simulateActivatePopSubscription (
  popId: string
): Promise<SimulatePayResult> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data: hasAccess, error: accessError } = await supabase.rpc(
      'user_has_pop_access',
      { pop_id: popId, user_id: user.uid }
    )

    if (accessError || !hasAccess) {
      return { success: false, error: 'No tenés acceso a este punto de venta.' }
    }

    const { data: pop, error: popError } = await supabase
      .from('pops')
      .select('id, owner_user_id')
      .eq('id', popId)
      .single()

    if (popError || !pop) {
      return { success: false, error: 'No se encontró el punto de venta.' }
    }

    if (pop.owner_user_id !== user.uid) {
      return {
        success: false,
        error: 'Solo el titular puede activar la suscripción.'
      }
    }

    const { data: subRow, error: subFetchError } = await supabase
      .from('pop_subscriptions')
      .select('pop_id')
      .eq('pop_id', popId)
      .maybeSingle()

    if (subFetchError) {
      console.error('pop_subscriptions select:', subFetchError)
      return { success: false, error: subFetchError.message }
    }

    if (!subRow) {
      return {
        success: false,
        error: 'No hay registro de suscripción para este POP.'
      }
    }

    let paidPlan: {
      id: string
      base_price_monthly: number | null
      base_price_yearly: number | null
    } | null = null

    for (const planName of PAID_PLAN_CANDIDATES) {
      const { data: row, error: planErr } = await supabase
        .from('subscription_plans')
        .select('id, base_price_monthly, base_price_yearly')
        .eq('name', planName)
        .eq('is_active', true)
        .maybeSingle()

      if (planErr) {
        console.error('subscription_plans lookup:', planErr)
        return {
          success: false,
          error:
            'No se pudo leer los planes. Verificá que exista la tabla subscription_plans y columnas base_price_* .'
        }
      }
      if (row) {
        paidPlan = row
        break
      }
    }

    if (!paidPlan) {
      return {
        success: false,
        error:
          'No hay un plan de pago configurado. Creá en subscription_plans una fila con name = \'started\' (o \'starter\') e is_active = true.'
      }
    }

    const now = new Date().toISOString()
    const periodEnd = new Date()
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 30)

    const priceMonthly = Number(paidPlan.base_price_monthly ?? 0)
    const priceYearly =
      paidPlan.base_price_yearly != null
        ? Number(paidPlan.base_price_yearly)
        : null

    const { error: subUpdateError } = await supabase
      .from('pop_subscriptions')
      .update({
        plan_id: paidPlan.id,
        status: 'active',
        current_period_start: now,
        current_period_end: periodEnd.toISOString(),
        price_monthly: priceMonthly,
        price_yearly: priceYearly
      })
      .eq('pop_id', popId)

    if (subUpdateError) {
      console.error('pop_subscriptions update:', subUpdateError)
      if (
        subUpdateError.code === '42501' ||
        subUpdateError.message?.toLowerCase().includes('policy')
      ) {
        return {
          success: false,
          error:
            'Supabase RLS bloqueó el cambio. En Table Editor → pop_subscriptions, agregá una política UPDATE para el dueño del POP (o usá el SQL opcional con SECURITY DEFINER en docs/supabase/rpc_simulate_activate_pop_subscription.sql).'
        }
      }
      return { success: false, error: subUpdateError.message }
    }

    const { error: popUpdateError } = await supabase
      .from('pops')
      .update({ is_active: true })
      .eq('id', popId)
      .eq('owner_user_id', user.uid)

    if (popUpdateError) {
      console.error('pops update:', popUpdateError)
      if (
        popUpdateError.code === '42501' ||
        popUpdateError.message?.toLowerCase().includes('policy')
      ) {
        return {
          success: false,
          error:
            'Supabase RLS bloqueó reactivar el POP. Revisá políticas UPDATE en la tabla pops para el owner.'
        }
      }
      return { success: false, error: popUpdateError.message }
    }

    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error inesperado'
    return { success: false, error: message }
  }
}
