'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAuthenticatedUser } from './authHelpers'

export async function checkUserPermission (
  popId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('user_has_permission', {
      pop_id: popId,
      user_id: user.uid,
      resource,
      action
    })

    if (error) {
      return false
    }

    return data === true
  } catch {
    return false
  }
}

export async function checkUserPopAccess (popId: string): Promise<boolean> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('user_has_pop_access', {
      pop_id: popId,
      user_id: user.uid
    })

    if (error) {
      return false
    }

    return data === true
  } catch {
    return false
  }
}

export async function getUserPopRole (popId: string): Promise<string | null> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_user_pop_role_name', {
      pop_id: popId,
      user_id: user.uid
    })

    if (error) {
      return null
    }

    return data || null
  } catch {
    return null
  }
}
