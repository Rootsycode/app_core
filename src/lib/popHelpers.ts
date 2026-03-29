'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAuthenticatedUser } from './authHelpers'
import { isPopActive } from './subscriptions'

export async function createPop (data: {
  name: string
  businessTypeId?: string
  imageUrl?: string
  settings?: Record<string, unknown>
}) {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

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

    const { data: subscriptionInfo } = await supabase.rpc(
      'get_pop_subscription_info',
      {
        pop_id: newPop.id
      }
    )

    return {
      success: true,
      pop: {
        ...newPop,
        subscription:
          subscriptionInfo && subscriptionInfo.length > 0
            ? subscriptionInfo[0]
            : null
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      error: 'Error inesperado',
      details: message
    }
  }
}

export type GetPopByIdOptions = {
  /** Solo para lógica servidor (p. ej. permisos). No enviar al cliente en menú. */
  includeOwnerUserId?: boolean
}

export async function getPopById (popId: string, options?: GetPopByIdOptions) {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

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

    const { data: pop, error: popError } = await supabase
      .from('pops')
      .select(
        'id, name, image_url, settings, owner_user_id, business_type_id, country, state, city, street_address, postal_code, phone, background_image_url, invoice_logo_url'
      )
      .eq('id', popId)
      .single()

    if (popError || !pop) {
      return {
        success: false,
        error: 'Error al obtener datos del POP'
      }
    }

    const lineFromColumns = [pop.street_address, pop.city, pop.state, pop.country]
      .filter(Boolean)
      .join(', ')
    const address =
      lineFromColumns || (pop.settings?.address as string | undefined) || null

    const base = {
      id: pop.id,
      name: pop.name,
      imageUrl: pop.image_url,
      address,
      country: pop.country ?? null,
      state: pop.state ?? null,
      city: pop.city ?? null,
      streetAddress: pop.street_address ?? null,
      postalCode: pop.postal_code ?? null,
      phone: pop.phone ?? null,
      backgroundImageUrl: pop.background_image_url ?? null,
      invoiceLogoUrl: pop.invoice_logo_url ?? null,
      settings: pop.settings || {}
    }

    if (options?.includeOwnerUserId) {
      return {
        success: true,
        pop: {
          ...base,
          ownerUserId: (pop.owner_user_id as string | null) ?? null
        }
      }
    }

    return {
      success: true,
      pop: base
    }
  } catch {
    return {
      success: false,
      error: 'Error inesperado al obtener datos del POP'
    }
  }
}

export async function validatePopAccess (popId: string): Promise<{
  hasAccess: boolean
  isActive: boolean
  error?: string
}> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

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
  } catch {
    return {
      hasAccess: false,
      isActive: false,
      error: 'Error al validar acceso al POP'
    }
  }
}
