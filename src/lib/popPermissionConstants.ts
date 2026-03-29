export type PopPermissionDef = {
  readonly resource: string
  readonly action: string
}

export const POP_SCREEN_RESOURCES = [
  'menu',
  'sale',
  'settings',
  'hr',
  'article'
] as const
export type PopScreenResource = (typeof POP_SCREEN_RESOURCES)[number]

export const POP_SCREEN_CRUD = ['read', 'create', 'update', 'delete'] as const
export type PopScreenCrudAction = (typeof POP_SCREEN_CRUD)[number]

export const POP_PERMS = {
  MENU_READ: { resource: 'menu', action: 'read' },
  MENU_CREATE: { resource: 'menu', action: 'create' },
  MENU_UPDATE: { resource: 'menu', action: 'update' },
  MENU_DELETE: { resource: 'menu', action: 'delete' },

  SALE_READ: { resource: 'sale', action: 'read' },
  SALE_CREATE: { resource: 'sale', action: 'create' },
  SALE_UPDATE: { resource: 'sale', action: 'update' },
  SALE_DELETE: { resource: 'sale', action: 'delete' },

  SETTINGS_READ: { resource: 'settings', action: 'read' },
  SETTINGS_CREATE: { resource: 'settings', action: 'create' },
  SETTINGS_UPDATE: { resource: 'settings', action: 'update' },
  SETTINGS_DELETE: { resource: 'settings', action: 'delete' },

  HR_READ: { resource: 'hr', action: 'read' },
  HR_CREATE: { resource: 'hr', action: 'create' },
  HR_UPDATE: { resource: 'hr', action: 'update' },
  HR_DELETE: { resource: 'hr', action: 'delete' },

  ARTICLE_READ: { resource: 'article', action: 'read' },
  ARTICLE_CREATE: { resource: 'article', action: 'create' },
  ARTICLE_UPDATE: { resource: 'article', action: 'update' },
  ARTICLE_DELETE: { resource: 'article', action: 'delete' }
} as const satisfies Record<string, PopPermissionDef>

export function permKey (p: PopPermissionDef): string {
  return `${p.resource}:${p.action}`
}

export function permissionKeysInclude (
  keys: readonly string[],
  resource: string,
  action: string
): boolean {
  return keys.includes(`${resource}:${action}`)
}

export function permissionKeysIncludeDef (
  keys: readonly string[],
  p: PopPermissionDef
): boolean {
  return permissionKeysInclude(keys, p.resource, p.action)
}
