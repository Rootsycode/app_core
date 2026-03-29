'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAuthenticatedUser } from './authHelpers'
import {
  getMenuResourceAction,
  mapMenuLabelsToPermissionFlags
} from './menuPermissions'
import {
  loadPopPermissionsSnapshot,
  type PopPermissionsSnapshotJSON
} from './popPermissionsServer'

export function mapMenuLabelsToPermissions (
  snapshot: PopPermissionsSnapshotJSON,
  menuItems: Array<{ label: string; link?: string }>
): Record<string, boolean> {
  return mapMenuLabelsToPermissionFlags(snapshot.keys, menuItems)
}

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
    const supabase = await createClient()

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
    const snapshot = await loadPopPermissionsSnapshot(popId)
    return mapMenuLabelsToPermissions(snapshot, menuItems)
  } catch {
    return menuItems.reduce((acc, item) => {
      acc[item.label] = false
      return acc
    }, {} as Record<string, boolean>)
  }
}
