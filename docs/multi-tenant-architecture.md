# Arquitectura Multi-Tenant para Rootsy

## Enfoque: Row-Level Security (RLS) con Supabase

**NO crear tablas diferentes por tenant** - Esto es una mala práctica porque:
- No escala bien
- Es difícil de mantener
- No permite queries cross-tenant cuando sea necesario
- Migraciones se vuelven complejas

## Estructura de Base de Datos Propuesta

### 1. Tablas Core

```sql
-- Tabla de Puntos de Venta (Tenants)
CREATE TABLE public.pops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Para URLs amigables
  image_url TEXT,
  owner_user_id UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Configuraciones específicas del POP
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Usuarios (ya existe, solo ajustar)
-- Mantener: id, first_name, last_name, image_url
-- Eliminar: pops (array) - reemplazar con tabla de relación

-- Tabla de Relación Usuario-POP con Roles
CREATE TABLE public.user_pop_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pop_id UUID REFERENCES public.pops(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pop_id) -- Un usuario solo puede tener un rol por POP
);

-- Tabla de Roles (ver también docs/supabase-access-security.md y docs/supabase/alter_roles_add_pop_id.sql)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_id UUID REFERENCES public.pops(id) ON DELETE CASCADE, -- NULL = rol sistema/plantilla; NOT NULL = rol custom del POP
  name TEXT NOT NULL, -- UNIQUE recomendado por (pop_id, name) en migración real, no global si hay homónimos por POP
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Permisos
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL, -- 'products', 'sales', 'reports', 'settings'
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'export'
  description TEXT,
  UNIQUE(resource, action)
);

-- Tabla de Relación Rol-Permiso
CREATE TABLE public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

### 2. Tablas de Negocio (con tenant_id)

Todas las tablas de negocio deben incluir `pop_id`:

```sql
-- Ejemplo: Productos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_id UUID REFERENCES public.pops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  price DECIMAL(10,2),
  -- ... otros campos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ejemplo: Ventas
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_id UUID REFERENCES public.pops(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  total DECIMAL(10,2),
  -- ... otros campos
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Row-Level Security (RLS) Policies

### Helper Functions

```sql
-- Función helper para obtener el POP actual del contexto
CREATE OR REPLACE FUNCTION public.get_current_pop_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Esto se puede pasar como parámetro en el contexto de la app
  -- O desde el JWT token
  SELECT current_setting('app.current_pop_id', true)::UUID;
$$;

-- Función helper para verificar si el usuario tiene acceso al POP
CREATE OR REPLACE FUNCTION public.user_has_pop_access(pop_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_pop_roles
    WHERE user_pop_roles.pop_id = user_has_pop_access.pop_id
      AND user_pop_roles.user_id = user_has_pop_access.user_id
      AND user_pop_roles.is_active = true
  );
$$;

-- Función helper para obtener el rol del usuario en un POP
CREATE OR REPLACE FUNCTION public.get_user_pop_role(pop_id UUID, user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role_id
  FROM public.user_pop_roles
  WHERE user_pop_roles.pop_id = get_user_pop_role.pop_id
    AND user_pop_roles.user_id = get_user_pop_role.user_id
    AND user_pop_roles.is_active = true
  LIMIT 1;
$$;

-- Función helper para verificar permisos
CREATE OR REPLACE FUNCTION public.user_has_permission(
  pop_id UUID,
  user_id UUID,
  resource TEXT,
  action TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_pop_roles upr
    JOIN public.role_permissions rp ON rp.role_id = upr.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE upr.pop_id = user_has_permission.pop_id
      AND upr.user_id = user_has_permission.user_id
      AND upr.is_active = true
      AND p.resource = user_has_permission.resource
      AND p.action = user_has_permission.action
  );
$$;
```

### RLS Policies

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.pops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pop_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Policies para POPs
CREATE POLICY "Users can view POPs they have access to"
  ON public.pops FOR SELECT
  USING (
    public.user_has_pop_access(id, auth.uid())
    OR owner_user_id = auth.uid()
  );

CREATE POLICY "Only owners can create POPs"
  ON public.pops FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners and admins can update POPs"
  ON public.pops FOR UPDATE
  USING (
    owner_user_id = auth.uid()
    OR public.user_has_permission(id, auth.uid(), 'pops', 'update')
  );

-- Policies para Products (ejemplo)
CREATE POLICY "Users can view products in their POPs"
  ON public.products FOR SELECT
  USING (
    public.user_has_pop_access(pop_id, auth.uid())
  );

CREATE POLICY "Users with create permission can insert products"
  ON public.products FOR INSERT
  WITH CHECK (
    public.user_has_pop_access(pop_id, auth.uid())
    AND public.user_has_permission(pop_id, auth.uid(), 'products', 'create')
  );

CREATE POLICY "Users with update permission can update products"
  ON public.products FOR UPDATE
  USING (
    public.user_has_pop_access(pop_id, auth.uid())
    AND public.user_has_permission(pop_id, auth.uid(), 'products', 'update')
  );
```

## Sistema de Roles y Permisos

### Roles Predefinidos

```sql
-- Insertar roles del sistema
INSERT INTO public.roles (name, display_name, description, is_system) VALUES
  ('owner', 'Propietario', 'Acceso total al POP', true),
  ('admin', 'Administrador', 'Gestiona usuarios y configuraciones', true),
  ('manager', 'Gerente', 'Gestiona operaciones diarias', true),
  ('cashier', 'Cajero', 'Procesa ventas', true),
  ('viewer', 'Visualizador', 'Solo lectura', true);
```

### Permisos por Recurso

```sql
-- Insertar permisos comunes
INSERT INTO public.permissions (resource, action, description) VALUES
  -- Products
  ('products', 'create', 'Crear productos'),
  ('products', 'read', 'Ver productos'),
  ('products', 'update', 'Actualizar productos'),
  ('products', 'delete', 'Eliminar productos'),
  
  -- Sales
  ('sales', 'create', 'Crear ventas'),
  ('sales', 'read', 'Ver ventas'),
  ('sales', 'update', 'Actualizar ventas'),
  ('sales', 'delete', 'Anular ventas'),
  ('sales', 'export', 'Exportar reportes de ventas'),
  
  -- Reports
  ('reports', 'read', 'Ver reportes'),
  ('reports', 'export', 'Exportar reportes'),
  
  -- Settings
  ('settings', 'read', 'Ver configuraciones'),
  ('settings', 'update', 'Actualizar configuraciones'),
  
  -- Users (gestión de usuarios del POP)
  ('users', 'create', 'Agregar usuarios al POP'),
  ('users', 'read', 'Ver usuarios del POP'),
  ('users', 'update', 'Actualizar roles de usuarios'),
  ('users', 'delete', 'Remover usuarios del POP');
```

### Asignar Permisos a Roles

```sql
-- Owner tiene todos los permisos
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'owner'),
  id
FROM public.permissions;

-- Admin tiene casi todos excepto eliminar POP
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'admin'),
  id
FROM public.permissions
WHERE NOT (resource = 'pops' AND action = 'delete');

-- Cashier puede crear/leer ventas y leer productos
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'cashier'),
  id
FROM public.permissions
WHERE (resource = 'sales' AND action IN ('create', 'read'))
   OR (resource = 'products' AND action = 'read');

-- Viewer solo lectura
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'viewer'),
  id
FROM public.permissions
WHERE action = 'read';
```

## Flujo de la Aplicación

### 1. Selección de POP
Cuando el usuario selecciona un POP, establecer en el contexto:

```typescript
// En el cliente o middleware
const currentPopId = 'uuid-del-pop-seleccionado';

// Pasar como header o en el contexto de la request
headers: {
  'x-pop-id': currentPopId
}
```

### 2. Middleware para establecer contexto
```typescript
// middleware.ts o en server actions
export async function setPopContext(popId: string) {
  // Verificar que el usuario tiene acceso
  const hasAccess = await checkUserPopAccess(userId, popId);
  if (!hasAccess) throw new Error('No access to this POP');
  
  // Establecer en el contexto de la query
  await supabase.rpc('set_current_pop_id', { pop_id: popId });
}
```

### 3. Queries automáticamente filtradas
Con RLS, todas las queries se filtran automáticamente:

```typescript
// Esto solo devuelve productos del POP actual si el usuario tiene acceso
const { data } = await supabase
  .from('products')
  .select('*');
// RLS automáticamente filtra por pop_id y verifica permisos
```

## Ventajas de este Enfoque

1. ✅ **Escalable**: No importa cuántos POPs tengas
2. ✅ **Seguro**: RLS garantiza aislamiento de datos
3. ✅ **Flexible**: Roles y permisos configurables
4. ✅ **Mantenible**: Una sola estructura de tablas
5. ✅ **Performante**: PostgreSQL optimiza las queries con RLS
6. ✅ **Auditable**: Fácil rastrear quién tiene acceso a qué

## Migración desde Estructura Actual

1. Crear nuevas tablas (roles, permissions, user_pop_roles)
2. Migrar datos de `users.pops` (array) a `user_pop_roles`
3. Agregar `pop_id` a todas las tablas de negocio
4. Crear RLS policies
5. Actualizar código de la aplicación

