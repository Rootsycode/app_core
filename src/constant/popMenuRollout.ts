/**
 * Enlaces del menú del POP habilitados en esta fase del producto.
 * Quien ya tiene acceso al POP puede abrir estas rutas aunque su rol
 * aún no tenga el permiso granular en `get_user_all_permissions`.
 * Las mutaciones en servidor siguen validando permisos (p. ej. settings:update).
 */
export const POP_MENU_ROLLOUT_LINKS = new Set(['sale', 'settings', 'hr'])
