'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from './authHelpers'

export async function canUserCreatePop (): Promise<{
  canCreate: boolean
  reason?: string
}> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('can_user_create_pop', {
      user_id: user.uid
    })

    if (error) {
      return { canCreate: false, reason: 'Error al verificar límite de POPs' }
    }

    if (!data) {
      const { data: userPops } = await supabase
        .from('pops')
        .select('id')
        .eq('owner_user_id', user.uid)

      if (userPops && userPops.length >= 1) {
        return {
          canCreate: false,
          reason:
            'Ya tienes un POP activo. Solo puedes tener 1 POP por cuenta.'
        }
      }
    }

    return { canCreate: data === true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('authenticated') || msg.includes('session')) {
      return {
        canCreate: false,
        reason: 'Debes iniciar sesión para crear un POP'
      }
    }
    return { canCreate: false, reason: 'Error al verificar límite de POPs' }
  }
}

export async function isPopActive (popId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('is_pop_active', {
      pop_id: popId
    })

    if (error) {
      return false
    }

    return data === true
  } catch {
    return false
  }
}

export async function getTrialDaysRemaining (
  popId: string
): Promise<number | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('get_trial_days_remaining', {
      pop_id: popId
    })

    if (error) {
      return null
    }

    return data
  } catch {
    return null
  }
}

export async function getPopSubscriptionInfo (popId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('get_pop_subscription_info', {
      pop_id: popId
    })

    if (error) {
      return null
    }

    return data && data.length > 0 ? data[0] : null
  } catch {
    return null
  }
}

export async function getSubscriptionPlans () {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('base_price_monthly', { ascending: true })

    if (error) {
      return []
    }

    return data || []
  } catch {
    return []
  }
}

export async function getBusinessTypes () {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from('business_types')
      .select('*')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (error) {
      return []
    }

    return data || []
  } catch {
    return []
  }
}
