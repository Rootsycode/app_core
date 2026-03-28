'use server'

import { getPopById, validatePopAccess } from '@/lib/popHelpers'
import { getMenuPermissions } from '@/lib/menuPermissionsServer'
import { MENU } from '@/constant/Menu'

/**
 * Obtiene los datos del POP y valida acceso
 */
export async function getPopMenuData(popId: string) {
  try {
    console.log('[getPopMenuData] Starting with popId:', popId)
    
    // Validar acceso al POP
    console.log('[getPopMenuData] Validating POP access...')
    const accessValidation = await validatePopAccess(popId)
    console.log('[getPopMenuData] Access validation result:', accessValidation)
    
    if (!accessValidation.hasAccess) {
      return {
        success: false,
        error: accessValidation.error || 'No tienes acceso a este POP',
        redirect: '/profile'
      }
    }

    if (!accessValidation.isActive) {
      return {
        success: false,
        error: accessValidation.error || 'Este POP no está activo',
        redirect: '/profile'
      }
    }

    // Obtener datos del POP
    console.log('[getPopMenuData] Getting POP data...')
    const popData = await getPopById(popId)
    console.log('[getPopMenuData] POP data result:', popData)
    
    if (!popData.success) {
      return {
        success: false,
        error: popData.error || 'Error al obtener datos del POP',
        redirect: '/profile'
      }
    }

    // Obtener permisos para todos los items del menú
    console.log('[getPopMenuData] Getting menu permissions...')
    const allMenuItems = MENU.flat()
    let permissions: Record<string, boolean> = {}
    
    try {
      permissions = await getMenuPermissions(popId, allMenuItems)
      console.log('[getPopMenuData] Permissions result:', Object.keys(permissions).length, 'permissions')
    } catch (permError: any) {
      console.error('[getPopMenuData] Error getting permissions, using defaults:', permError)
      // Si falla la obtención de permisos, permitir todos por defecto (temporal para debug)
      permissions = allMenuItems.reduce((acc, item) => {
        acc[item.label] = true
        return acc
      }, {} as Record<string, boolean>)
    }

    return {
      success: true,
      pop: popData.pop,
      permissions
    }
  } catch (error: any) {
    console.error('[getPopMenuData] Error getting POP menu data:', error)
    console.error('[getPopMenuData] Error stack:', error.stack)
    return {
      success: false,
      error: 'Error inesperado: ' + (error.message || 'Error desconocido'),
      redirect: '/profile'
    }
  }
}

