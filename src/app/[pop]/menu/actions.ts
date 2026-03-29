'use server'

import { getPopById, validatePopAccess } from '@/lib/popHelpers'

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

    return {
      success: true,
      pop: popData.pop
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
