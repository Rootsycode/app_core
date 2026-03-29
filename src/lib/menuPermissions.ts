import { permissionKeysInclude } from '@/lib/popPermissionConstants'

export function mapMenuLabelsToPermissionFlags (
  permissionKeys: readonly string[],
  menuItems: Array<{ label: string; link?: string }>
): Record<string, boolean> {
  const permissionsMap: Record<string, boolean> = {}
  for (const item of menuItems) {
    const permission = getMenuResourceAction(item.label, item.link)
    if (!permission) {
      permissionsMap[item.label] = true
      continue
    }
    permissionsMap[item.label] = permissionKeysInclude(
      permissionKeys,
      permission.resource,
      permission.action
    )
  }
  return permissionsMap
}

export function getMenuResourceAction (
  menuLabel: string,
  menuLink?: string
): {
  resource: string
  action: string
} | null {
  void menuLabel
  if (!menuLink) return null
  if (menuLink === 'sale') return { resource: 'sale', action: 'read' }
  if (menuLink === 'settings') return { resource: 'settings', action: 'read' }
  if (menuLink === 'hr') return { resource: 'hr', action: 'read' }
  if (menuLink === 'articles') return { resource: 'article', action: 'read' }
  return { resource: 'menu', action: 'read' }
}
