'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from './authHelpers'
import { getMenuResourceAction } from './menuPermissions'

export async function checkMenuPermission (
  popId: string,
  menuLabel: string
): Promise<boolean> {
  try {
    const permission = getMenuResourceAction(menuLabel)

    if (!permission) {
      return true
    }

    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('user_has_permission', {
      pop_id: popId,
      user_id: user.uid,
      resource: permission.resource,
      action: permission.action
    })

    if (error) {
      return false
    }

    return data === true
  } catch {
    return false
  }
}

export async function getMenuPermissions (
  popId: string,
  menuItems: Array<{ label: string; link?: string }>
): Promise<Record<string, boolean>> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data: userPermissions, error: permissionsError } = await supabase.rpc(
      'get_user_all_permissions',
      {
        pop_id: popId,
        user_id: user.uid
      }
    )

    if (permissionsError) {
      return menuItems.reduce((acc, item) => {
        acc[item.label] = false
        return acc
      }, {} as Record<string, boolean>)
    }

    const permissionsSet = new Set<string>()
    if (userPermissions && Array.isArray(userPermissions)) {
      userPermissions.forEach((perm: { resource: string; action: string }) => {
        permissionsSet.add(`${perm.resource}:${perm.action}`)
      })
    }

    const permissionsMap: Record<string, boolean> = {}

    menuItems.forEach((item) => {
      const permission = getMenuResourceAction(item.label, item.link)
      if (!permission) {
        permissionsMap[item.label] = true
        return
      }

      const permissionKey = `${permission.resource}:${permission.action}`
      permissionsMap[item.label] = permissionsSet.has(permissionKey)
    })

    return permissionsMap
  } catch {
    return menuItems.reduce((acc, item) => {
      acc[item.label] = false
      return acc
    }, {} as Record<string, boolean>)
  }
}
