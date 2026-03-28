'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from './authHelpers'
import { isPopActive } from './subscriptions'

/**
 * Crea un nuevo POP con validación de límites
 */
export async function createPop(data: {
  name: string
  businessTypeId?: string
  imageUrl?: string
  settings?: Record<string, any>
}) {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Verificar si el usuario puede crear un POP
    const { data: canCreate, error: canCreateError } = await supabase.rpc(
      'can_user_create_pop',
      {
        user_id: user.uid
      }
    )

    if (canCreateError) {
      return {
        success: false,
        error: 'Error al verificar límite de POPs',
        details: canCreateError.message
      }
    }

    if (!canCreate) {
      // Verificar cuántos POPs tiene
      const { data: existingPops } = await supabase
        .from('pops')
        .select('id')
        .eq('owner_user_id', user.uid)

      if (existingPops && existingPops.length >= 1) {
        return {
          success: false,
          error: 'Límite alcanzado',
          details:
            'Ya tienes un POP activo. Solo puedes tener 1 POP por cuenta. Si tu POP actual está en prueba, puedes cancelarlo y crear uno nuevo.'
        }
      }

      return {
        success: false,
        error: 'No puedes crear más POPs',
        details: 'Solo puedes tener 1 POP por cuenta.'
      }
    }

    // Crear el POP (el trigger creará automáticamente la suscripción trial)
    const { data: newPop, error: createError } = await supabase
      .from('pops')
      .insert({
        name: data.name,
        owner_user_id: user.uid,
        business_type_id: data.businessTypeId || null,
        image_url: data.imageUrl || null,
        settings: data.settings || {},
        is_active: true
      })
      .select('id, name, business_type_id, subscription_id')
      .single()

    if (createError) {
      return {
        success: false,
        error: 'Error al crear POP',
        details: createError.message
      }
    }

    // Obtener información de la suscripción creada
    const { data: subscriptionInfo } = await supabase
      .rpc('get_pop_subscription_info', {
        pop_id: newPop.id
      })

    return {
      success: true,
      pop: {
        ...newPop,
        subscription: subscriptionInfo && subscriptionInfo.length > 0 ? subscriptionInfo[0] : null
      }
    }
  } catch (error: any) {
    console.error('Error creating POP:', error)
    return {
      success: false,
      error: 'Error inesperado',
      details: error.message
    }
  }
}

/**
 * Obtiene los datos de un POP por ID
 */
export async function getPopById(popId: string) {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Verificar acceso primero
    const { data: hasAccess, error: accessError } = await supabase.rpc(
      'user_has_pop_access',
      {
        pop_id: popId,
        user_id: user.uid
      }
    )

    if (accessError || !hasAccess) {
      return {
        success: false,
        error: 'No tienes acceso a este POP'
      }
    }

    // Obtener datos del POP
    const { data: pop, error: popError } = await supabase
      .from('pops')
      .select('id, name, image_url, settings, owner_user_id, business_type_id')
      .eq('id', popId)
      .single()

    if (popError || !pop) {
      return {
        success: false,
        error: 'Error al obtener datos del POP'
      }
    }

    // Obtener dirección desde settings si existe
    const address = pop.settings?.address || null

    return {
      success: true,
      pop: {
        id: pop.id,
        name: pop.name,
        imageUrl: pop.image_url,
        address: address,
        settings: pop.settings || {}
      }
    }
  } catch (error: any) {
    console.error('Error getting POP:', error)
    return {
      success: false,
      error: 'Error inesperado al obtener datos del POP'
    }
  }
}

/**
 * Valida que un POP esté activo antes de realizar operaciones
 */
export async function validatePopAccess(popId: string): Promise<{
  hasAccess: boolean
  isActive: boolean
  error?: string
}> {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Verificar acceso al POP
    const { data: hasAccess, error: accessError } = await supabase.rpc(
      'user_has_pop_access',
      {
        pop_id: popId,
        user_id: user.uid
      }
    )

    if (accessError || !hasAccess) {
      return {
        hasAccess: false,
        isActive: false,
        error: 'No tienes acceso a este POP'
      }
    }

    // Verificar si el POP está activo
    const active = await isPopActive(popId)

    if (!active) {
      return {
        hasAccess: true,
        isActive: false,
        error:
          'Este POP no está activo. La prueba gratuita ha expirado o la suscripción está vencida. Por favor, actualiza tu suscripción para continuar.'
      }
    }

    return {
      hasAccess: true,
      isActive: true
    }
  } catch (error: any) {
    console.error('Error validating POP access:', error)
    return {
      hasAccess: false,
      isActive: false,
      error: 'Error al validar acceso al POP'
    }
  }
}

