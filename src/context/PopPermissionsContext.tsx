'use client'

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode
} from 'react'
import {
  type PopPermissionDef,
  permissionKeysInclude,
  permissionKeysIncludeDef
} from '@/lib/popPermissionConstants'
import type { PopPermissionsSnapshotJSON } from '@/lib/popPermissionsServer'

export type PopPermissionsContextValue = {
  popId: string
  permissionKeys: readonly string[]
  hasPermission: (resource: string, action: string) => boolean
  hasPermissionDef: (def: PopPermissionDef) => boolean
}

const PopPermissionsContext = createContext<
  PopPermissionsContextValue | undefined
>(undefined)

type ProviderProps = {
  popId: string
  initialSnapshot: PopPermissionsSnapshotJSON
  children: ReactNode
}

export function PopPermissionsProvider ({
  popId,
  initialSnapshot,
  children
}: ProviderProps) {
  const permissionKeys = initialSnapshot.keys
  const value = useMemo<PopPermissionsContextValue>(
    () => ({
      popId,
      permissionKeys,
      hasPermission: (resource, action) =>
        permissionKeysInclude(permissionKeys, resource, action),
      hasPermissionDef: (def) =>
        permissionKeysIncludeDef(permissionKeys, def)
    }),
    [popId, permissionKeys]
  )

  return (
    <PopPermissionsContext.Provider value={value}>
      {children}
    </PopPermissionsContext.Provider>
  )
}

export function usePopPermissions (): PopPermissionsContextValue {
  const ctx = useContext(PopPermissionsContext)
  if (!ctx) {
    throw new Error('usePopPermissions debe usarse dentro de [pop]')
  }
  return ctx
}
