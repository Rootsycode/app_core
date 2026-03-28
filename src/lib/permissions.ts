'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from './authHelpers'

/**
 * Verifica si el usuario tiene un permiso específico en un POP
 */
export async function checkUserPermission(
  popId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('user_has_permission', {
      pop_id: popId,
      user_id: user.uid,
      resource,
      action
    })

    if (error) {
      console.error('Error checking permission:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Verifica si el usuario tiene acceso a un POP
 */
export async function checkUserPopAccess(popId: string): Promise<boolean> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('user_has_pop_access', {
      pop_id: popId,
      user_id: user.uid
    })

    if (error) {
      console.error('Error checking POP access:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error checking POP access:', error)
    return false
  }
}

/**
 * Obtiene el rol del usuario en un POP
 */
export async function getUserPopRole(popId: string): Promise<string | null> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('get_user_pop_role_name', {
      pop_id: popId,
      user_id: user.uid
    })

    if (error) {
      console.error('Error getting user POP role:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Error getting user POP role:', error)
    return null
  }
}

