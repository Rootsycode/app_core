'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAuthenticatedUser } from '@/lib/authHelpers'
import { getPopById, validatePopAccess } from '@/lib/popHelpers'
import { createClient } from '@/utils/supabase/server'

export type PopOutletSettingsDTO = {
  id: string
  name: string
  country: string | null
  state: string | null
  city: string | null
  streetAddress: string | null
  postalCode: string | null
  phone: string | null
  logoUrl: string | null
  backgroundImageUrl: string | null
  invoiceLogoUrl: string | null
  canUpdate: boolean
}

export type UpdatePopSettingsInput = {
  name?: string
  country?: string | null
  state?: string | null
  city?: string | null
  streetAddress?: string | null
  postalCode?: string | null
  phone?: string | null
  logoUrl?: string | null
  backgroundImageUrl?: string | null
  invoiceLogoUrl?: string | null
}

/** Compara ids de usuario/auth aunque difieran en mayúsculas o guiones UUID. */
function sameUserId (a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/-/g, '').toLowerCase().trim()
  return norm(a) === norm(b)
}

/**
 * Owner (owner_user_id del POP) siempre puede editar la configuración del POP (settings).
 * El resto: RPC settings:update (roles).
 * `knownOwnerUserId` debe venir del mismo `getPopById(..., { includeOwnerUserId: true })` que ya pasó RLS.
 */
async function userCanUpdatePopSettings (
  supabase: SupabaseClient,
  popId: string,
  userId: string,
  knownOwnerUserId?: string | null
): Promise<boolean> {
  if (
    knownOwnerUserId != null &&
    String(knownOwnerUserId).length > 0 &&
    sameUserId(String(knownOwnerUserId), userId)
  ) {
    return true
  }

  const { data, error } = await supabase.rpc('user_has_permission', {
    pop_id: popId,
    user_id: userId,
    resource: 'settings',
    action: 'update'
  })
  if (error) return false
  return data === true
}

export async function getPopSettingsForEdit (
  popId: string
): Promise<
  | { success: true; pop: PopOutletSettingsDTO }
  | { success: false; error: string; redirect?: string }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess) {
      return {
        success: false,
        error: access.error || 'No tenés acceso a este POP',
        redirect: '/home'
      }
    }
    if (!access.isActive) {
      return {
        success: false,
        error: access.error || 'Este POP no está activo',
        redirect: '/home'
      }
    }

    const popRes = await getPopById(popId, { includeOwnerUserId: true })
    if (!popRes.success || !popRes.pop) {
      return {
        success: false,
        error: popRes.error || 'No se pudieron cargar los datos del POP',
        redirect: '/home'
      }
    }

    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const ownerUserId =
      'ownerUserId' in popRes.pop ? popRes.pop.ownerUserId : null
    const canUpdate = await userCanUpdatePopSettings(
      supabase,
      popId,
      user.uid,
      ownerUserId
    )

    const p = popRes.pop
    return {
      success: true,
      pop: {
        id: p.id,
        name: p.name,
        country: p.country ?? null,
        state: p.state ?? null,
        city: p.city ?? null,
        streetAddress: p.streetAddress ?? null,
        postalCode: p.postalCode ?? null,
        phone: p.phone ?? null,
        logoUrl: p.imageUrl ?? null,
        backgroundImageUrl: p.backgroundImageUrl ?? null,
        invoiceLogoUrl: p.invoiceLogoUrl ?? null,
        canUpdate
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function updatePopSettings (
  popId: string,
  input: UpdatePopSettingsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return {
        success: false,
        error: access.error || 'Sin acceso al POP'
      }
    }

    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const popOwner = await getPopById(popId, { includeOwnerUserId: true })
    if (!popOwner.success || !popOwner.pop) {
      return {
        success: false,
        error: popOwner.error || 'No se pudieron verificar los datos del POP.'
      }
    }
    const ownerUserId =
      'ownerUserId' in popOwner.pop ? popOwner.pop.ownerUserId : null
    const canUpdate = await userCanUpdatePopSettings(
      supabase,
      popId,
      user.uid,
      ownerUserId
    )
    if (!canUpdate) {
      return {
        success: false,
        error: 'No tenés permiso para editar la configuración de este punto de venta.'
      }
    }

    const patch: Record<string, string | null> = {}

    if (input.name !== undefined) {
      const n = input.name.trim()
      if (!n) {
        return { success: false, error: 'El nombre no puede quedar vacío.' }
      }
      patch.name = n
    }
    if (input.country !== undefined) patch.country = input.country
    if (input.state !== undefined) patch.state = input.state
    if (input.city !== undefined) patch.city = input.city
    if (input.streetAddress !== undefined) {
      patch.street_address = input.streetAddress
    }
    if (input.postalCode !== undefined) patch.postal_code = input.postalCode
    if (input.phone !== undefined) patch.phone = input.phone
    if (input.logoUrl !== undefined) patch.image_url = input.logoUrl
    if (input.backgroundImageUrl !== undefined) {
      patch.background_image_url = input.backgroundImageUrl
    }
    if (input.invoiceLogoUrl !== undefined) {
      patch.invoice_logo_url = input.invoiceLogoUrl
    }

    if (Object.keys(patch).length === 0) {
      return { success: true }
    }

    const { error: upErr } = await supabase
      .from('pops')
      .update(patch)
      .eq('id', popId)

    if (upErr) {
      return {
        success: false,
        error: upErr.message || 'No se pudo guardar.'
      }
    }

    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { success: false, error: message }
  }
}
