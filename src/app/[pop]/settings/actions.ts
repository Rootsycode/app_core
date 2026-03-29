'use server'

import {
  POP_PERMS,
  permissionKeysInclude
} from '@/lib/popPermissionConstants'
import { getPopById, validatePopAccess } from '@/lib/popHelpers'
import { loadPopPermissionsSnapshot } from '@/lib/popPermissionsServer'
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
  permissionKeys: string[]
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

    const permSnapshot = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        permSnapshot.keys,
        POP_PERMS.SETTINGS_READ.resource,
        POP_PERMS.SETTINGS_READ.action
      )
    ) {
      return {
        success: false,
        error: 'No tenés permiso para ver los ajustes de este punto de venta.',
        redirect: `/${popId}/menu`
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

    const canUpdate = permissionKeysInclude(
      permSnapshot.keys,
      POP_PERMS.SETTINGS_UPDATE.resource,
      POP_PERMS.SETTINGS_UPDATE.action
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
        canUpdate,
        permissionKeys: permSnapshot.keys
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

    const permSnapshot = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        permSnapshot.keys,
        POP_PERMS.SETTINGS_UPDATE.resource,
        POP_PERMS.SETTINGS_UPDATE.action
      )
    ) {
      return {
        success: false,
        error: 'No tenés permiso para editar la configuración de este punto de venta.'
      }
    }

    const supabase = await createClient()

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
