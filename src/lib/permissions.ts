'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from './authHelpers'

export async function checkUserPermission (
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
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

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
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

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
