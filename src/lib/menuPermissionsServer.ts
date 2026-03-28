'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from './authHelpers'
import { getMenuResourceAction } from './menuPermissions'

/**
 * Verifica si el usuario tiene permiso para acceder a un item del menú
 */
export async function checkMenuPermission(
  popId: string,
  menuLabel: string
): Promise<boolean> {
  try {
    const permission = getMenuResourceAction(menuLabel)
    
    if (!permission) {
      // Si no hay mapeo, permitir acceso (items sin link o sin permisos definidos)
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
      console.error('Error checking menu permission:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error checking menu permission:', error)
    return false
  }
}

/**
 * Obtiene los permisos para todos los items del menú de una vez
 * Optimizado: hace una sola consulta SQL en lugar de múltiples RPC calls
 */
export async function getMenuPermissions(
  popId: string,
  menuItems: Array<{ label: string; link?: string }>
): Promise<Record<string, boolean>> {
  try {
    console.log('[getMenuPermissions] Starting with popId:', popId, 'menuItems:', menuItems.length)
    const user = await requireAuthenticatedUser()
    console.log('[getMenuPermissions] User:', user.uid)
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Obtener todos los permisos del usuario en un POP de una vez
    const { data: userPermissions, error: permissionsError } = await supabase.rpc(
      'get_user_all_permissions',
      {
        pop_id: popId,
        user_id: user.uid
      }
    )

    if (permissionsError) {
      console.error('[getMenuPermissions] Error getting all permissions:', permissionsError)
      // En caso de error, retornar todos como false (más seguro)
      return menuItems.reduce((acc, item) => {
        acc[item.label] = false
        return acc
      }, {} as Record<string, boolean>)
    }

    // Crear un Set de permisos para búsqueda rápida
    const permissionsSet = new Set<string>()
    if (userPermissions && Array.isArray(userPermissions)) {
      userPermissions.forEach((perm: { resource: string; action: string }) => {
        permissionsSet.add(`${perm.resource}:${perm.action}`)
      })
    }

    console.log('[getMenuPermissions] User has', permissionsSet.size, 'permissions')

    // Crear un mapa de resultados
    const permissionsMap: Record<string, boolean> = {}

    // Verificar cada item del menú
    menuItems.forEach((item) => {
      const permission = getMenuResourceAction(item.label, item.link)
      if (!permission) {
        // Sin mapeo = permitido
        permissionsMap[item.label] = true
        return
      }

      // Verificar si el usuario tiene este permiso
      const permissionKey = `${permission.resource}:${permission.action}`
      permissionsMap[item.label] = permissionsSet.has(permissionKey)
    })

    console.log('[getMenuPermissions] Completed. Permissions:', Object.keys(permissionsMap).length)
    return permissionsMap
  } catch (error) {
    console.error('[getMenuPermissions] Error getting menu permissions:', error)
    console.error('[getMenuPermissions] Error stack:', error instanceof Error ? error.stack : 'No stack')
    // En caso de error, retornar todos como false (más seguro)
    return menuItems.reduce((acc, item) => {
      acc[item.label] = false
      return acc
    }, {} as Record<string, boolean>)
  }
}

