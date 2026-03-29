-- Referencia: columnas de domicilio e imágenes de marca en `pops`, y bucket `pop-assets`.
-- Las migraciones equivalentes pueden aplicarse con Supabase CLI o MCP `apply_migration`.

ALTER TABLE public.pops
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS background_image_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_logo_url TEXT;

-- Bucket y políticas: ver migraciones `storage_pop_assets_bucket` y
-- `pop_assets_storage_policies_settings_update` en el historial del proyecto.
--
-- Importante (RLS en storage.objects): el primer segmento del path debe ser `pops.id`.
-- `public.pops` tiene columna `name` (nombre del local): dentro de un EXISTS (... FROM pops p
-- WHERE split_part(name,...)) el `name` suelto es p.name, no la ruta del archivo — falla RLS.
-- Patrón seguro: `split_part(name,'/',1) IN (SELECT p.id::text FROM pops p WHERE ...)`.
-- Migraciones: `fix_pop_assets_storage_rls_object_name`, `fix_pop_assets_rls_name_column_ambiguity`.
