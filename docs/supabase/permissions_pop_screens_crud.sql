DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE resource NOT IN ('menu', 'sale', 'settings', 'hr', 'article')
);

DELETE FROM public.permissions
WHERE resource NOT IN ('menu', 'sale', 'settings', 'hr', 'article');

INSERT INTO public.permissions (resource, action, description)
SELECT v.resource, v.action, v.description
FROM (
  VALUES
    ('menu', 'read', 'Menú POP: ver iconos'),
    ('menu', 'create', 'Menú POP: crear (reservado)'),
    ('menu', 'update', 'Menú POP: editar (reservado)'),
    ('menu', 'delete', 'Menú POP: eliminar (reservado)'),
    ('sale', 'read', 'Ventas: ver pantalla'),
    ('sale', 'create', 'Ventas: registrar operaciones'),
    ('sale', 'update', 'Ventas: modificar'),
    ('sale', 'delete', 'Ventas: anular / borrar'),
    ('settings', 'read', 'Ajustes: ver datos del POP'),
    ('settings', 'create', 'Ajustes: crear (reservado)'),
    ('settings', 'update', 'Ajustes: editar POP'),
    ('settings', 'delete', 'Ajustes: eliminar (reservado)'),
    ('hr', 'read', 'RRHH: ver pantalla'),
    ('hr', 'create', 'RRHH: invitar (cuando aplique política)'),
    ('hr', 'update', 'RRHH: editar permisos de roles (cuando aplique política)'),
    ('hr', 'delete', 'RRHH: revocar / desvincular (cuando aplique política)'),
    ('article', 'read', 'Artículos: ver listado'),
    ('article', 'create', 'Artículos: crear'),
    ('article', 'update', 'Artículos: editar'),
    ('article', 'delete', 'Artículos: eliminar')
) AS v(resource, action, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions p
  WHERE p.resource = v.resource::text AND p.action = v.action::text
);
