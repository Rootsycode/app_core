-- =============================================================================
-- Paso 1: columna roles.pop_id (roles de sistema vs custom por POP)
-- Ejecutar en Supabase → SQL Editor (o migración).
-- Luego ejecutar: rpc_user_has_permission.sql (y opcional rpc_get_user_all_permissions.sql)
-- =============================================================================
--
-- Semántica (docs/supabase-access-security.md):
--   pop_id IS NULL  → rol de plantilla / sistema
--   pop_id NOT NULL → rol definido solo para ese punto de venta

ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS pop_id UUID REFERENCES public.pops(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_roles_pop_id ON public.roles (pop_id);

COMMENT ON COLUMN public.roles.pop_id IS
  'NULL = rol de sistema/plantilla; UUID = rol custom de ese POP.';
