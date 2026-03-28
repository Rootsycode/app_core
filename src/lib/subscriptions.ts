'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from './authHelpers'

/**
 * Verifica si el usuario puede crear un nuevo POP
 * Reglas:
 * - 1 POP por usuario máximo
 * - Si tiene 1 POP, solo puede crear otro si el actual está en trial
 */
export async function canUserCreatePop(): Promise<{ canCreate: boolean; reason?: string }> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('can_user_create_pop', {
      user_id: user.uid
    })

    if (error) {
      console.error('Error checking if user can create POP:', error)
      return { canCreate: false, reason: 'Error al verificar límite de POPs' }
    }

    if (!data) {
      // Verificar cuántos POPs tiene el usuario
      const { data: userPops } = await supabase
        .from('pops')
        .select('id')
        .eq('owner_user_id', user.uid)

      if (userPops && userPops.length >= 1) {
        return {
          canCreate: false,
          reason: 'Ya tienes un POP activo. Solo puedes tener 1 POP por cuenta.'
        }
      }
    }

    return { canCreate: data === true }
  } catch (error: any) {
    console.error('Error checking if user can create POP:', error)
    // Si el error es de autenticación, retornar mensaje específico
    if (error?.message?.includes('authenticated') || error?.message?.includes('session')) {
      return { canCreate: false, reason: 'Debes iniciar sesión para crear un POP' }
    }
    return { canCreate: false, reason: 'Error al verificar límite de POPs' }
  }
}

/**
 * Verifica si un POP está activo (trial o suscripción activa)
 */
export async function isPopActive(popId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('is_pop_active', {
      pop_id: popId
    })

    if (error) {
      console.error('Error checking if POP is active:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error checking if POP is active:', error)
    return false
  }
}

/**
 * Obtiene los días restantes del trial de un POP
 */
export async function getTrialDaysRemaining(popId: string): Promise<number | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('get_trial_days_remaining', {
      pop_id: popId
    })

    if (error) {
      console.error('Error getting trial days remaining:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting trial days remaining:', error)
    return null
  }
}

/**
 * Obtiene información completa de la suscripción de un POP
 */
export async function getPopSubscriptionInfo(popId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('get_pop_subscription_info', {
      pop_id: popId
    })

    if (error) {
      console.error('Error getting subscription info:', error)
      return null
    }

    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error getting subscription info:', error)
    return null
  }
}

/**
 * Obtiene todos los planes de suscripción disponibles
 * (No requiere autenticación - datos públicos)
 */
export async function getSubscriptionPlans() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('base_price_monthly', { ascending: true })

    if (error) {
      console.error('Error getting subscription plans:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting subscription plans:', error)
    return []
  }
}

/**
 * Obtiene todos los tipos de negocio disponibles
 * (No requiere autenticación - datos públicos)
 */
export async function getBusinessTypes() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from('business_types')
      .select('*')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (error) {
      console.error('Error getting business types:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting business types:', error)
    return []
  }
}

