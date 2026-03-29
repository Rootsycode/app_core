'use server'

import { getPopById, validatePopAccess } from '@/lib/popHelpers'
import { getMenuPermissions } from '@/lib/menuPermissionsServer'
import { MENU } from '@/constant/Menu'
import { POP_MENU_ROLLOUT_LINKS } from '@/constant/popMenuRollout'

export async function getPopMenuData (popId: string) {
  try {
    const accessValidation = await validatePopAccess(popId)

    if (!accessValidation.hasAccess) {
      return {
        success: false,
        error: accessValidation.error || 'No tienes acceso a este POP',
        redirect: '/home'
      }
    }

    if (!accessValidation.isActive) {
      return {
        success: false,
        error: accessValidation.error || 'Este POP no está activo',
        redirect: '/home'
      }
    }

    const popData = await getPopById(popId)

    if (!popData.success) {
      return {
        success: false,
        error: popData.error || 'Error al obtener datos del POP',
        redirect: '/home'
      }
    }

    const allMenuItems = MENU.flat()
    let permissions: Record<string, boolean> = {}

    try {
      permissions = await getMenuPermissions(popId, allMenuItems)
    } catch {
      permissions = allMenuItems.reduce((acc, item) => {
        acc[item.label] = true
        return acc
      }, {} as Record<string, boolean>)
    }

    for (const item of allMenuItems) {
      if (item.link && POP_MENU_ROLLOUT_LINKS.has(item.link)) {
        permissions[item.label] = true
      }
    }

    return {
      success: true,
      pop: popData.pop,
      permissions
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      error: 'Error inesperado: ' + message,
      redirect: '/home'
    }
  }
}
