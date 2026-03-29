'use server'

import {
  POP_PERMS,
  permissionKeysInclude
} from '@/lib/popPermissionConstants'
import { validatePopAccess } from '@/lib/popHelpers'
import { loadPopPermissionsSnapshot } from '@/lib/popPermissionsServer'
import { createClient } from '@/utils/supabase/server'
import { SALE_CATALOG_RLS_DENIED_MESSAGE } from '@/lib/saleCatalogMessages'

export type SaleCategoryRow = {
  id: string
  name: string
}

export type SaleArticleRow = {
  id: string
  title: string
  description: string
  sale_price: number
  category: string
  category_id: string
  iva: number
}

function isLikelyRlsOrPermissionDenied (err: {
  code?: string
  message?: string
}): boolean {
  const c = String(err.code || '')
  const m = (err.message || '').toLowerCase()
  return (
    c === '42501' ||
    c === 'PGRST301' ||
    m.includes('permission denied') ||
    m.includes('row-level security') ||
    m.includes('violates row-level') ||
    m.includes('rls')
  )
}

function mapArticleRow (row: Record<string, unknown>): SaleArticleRow {
  const cat = row.categories as Record<string, unknown> | null | undefined
  const categoryName =
    (cat?.name as string | undefined) ?? 'Sin categoría'
  const name = (row.name ?? 'Sin nombre') as string
  return {
    id: String(row.id),
    title: String(name),
    description: String(row.description ?? ''),
    sale_price: Number(row.sale_price ?? 0) || 0,
    category: String(categoryName),
    category_id: String(row.category_id ?? ''),
    iva: Number(row.iva ?? 0) || 0
  }
}

async function assertSalesScreenPermission (popId: string): Promise<
  | { ok: true }
  | { ok: false; error: string; redirect: string }
> {
  const snap = await loadPopPermissionsSnapshot(popId)
  if (
    !permissionKeysInclude(
      snap.keys,
      POP_PERMS.SALE_READ.resource,
      POP_PERMS.SALE_READ.action
    )
  ) {
    return {
      ok: false,
      error:
        'No tenés permiso para ver la pantalla de Ventas en este punto de venta.',
      redirect: `/${popId}/menu`
    }
  }
  return { ok: true }
}

export async function getSaleCategories (popId: string) {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return {
        success: false,
        error: access.error || 'Sin acceso',
        categories: [] as SaleCategoryRow[],
        source: 'none' as const
      }
    }

    const gate = await assertSalesScreenPermission(popId)
    if (!gate.ok) {
      return {
        success: false,
        error: gate.error,
        redirect: gate.redirect,
        categories: [] as SaleCategoryRow[],
        source: 'none' as const
      }
    }

    const supabase = await createClient()

    const { data: popRow } = await supabase
      .from('pops')
      .select('name')
      .eq('id', popId)
      .maybeSingle()

    const popName =
      typeof popRow?.name === 'string' && popRow.name.trim()
        ? popRow.name.trim()
        : 'Punto de venta'

    const { data: rows, error } = await supabase
      .from('categories')
      .select('id,name,visible,sort_order')
      .eq('pop_id', popId)
      .eq('visible', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      const msg = error.message || ''
      if (isLikelyRlsOrPermissionDenied(error)) {
        return {
          success: false,
          error: SALE_CATALOG_RLS_DENIED_MESSAGE,
          categories: [] as SaleCategoryRow[],
          source: 'none' as const,
          popName
        }
      }
      const missing =
        msg.includes('does not exist') || msg.includes('schema cache')
      return {
        success: true,
        categories: [] as SaleCategoryRow[],
        source: 'categories' as const,
        warning: missing
          ? 'No existe la tabla `categories` en Supabase. Ejecutá la migración correspondiente.'
          : msg,
        popName
      }
    }

    const categories: SaleCategoryRow[] = (rows || []).map(
      (r: { id: string; name: string }) => ({
        id: String(r.id),
        name: String(r.name)
      })
    )

    return {
      success: true,
      categories,
      source: 'categories' as const,
      warning: null as string | null,
      popName
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return {
      success: false,
      error: message,
      categories: [] as SaleCategoryRow[],
      source: 'none' as const
    }
  }
}

export async function getSaleProducts (
  popId: string,
  filters: { search: string; categoryId: string },
  options?: { countOnly?: boolean }
) {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return {
        success: false,
        error: access.error || 'Sin acceso',
        articles: [] as SaleArticleRow[],
        count: 0
      }
    }

    const gate = await assertSalesScreenPermission(popId)
    if (!gate.ok) {
      return {
        success: false,
        error: gate.error,
        redirect: gate.redirect,
        articles: [] as SaleArticleRow[],
        count: 0
      }
    }

    const supabase = await createClient()

    const search = (filters.search || '').trim().toLowerCase()
    const categoryId = (filters.categoryId || '').trim()

    let q = supabase
      .from('articles')
      .select(
        `
        id,
        name,
        description,
        sale_price,
        iva,
        category_id,
        is_active,
        categories!inner (
          id,
          name,
          visible
        )
      `
      )
      .eq('pop_id', popId)
      .eq('is_active', true)

    if (categoryId) {
      q = q.eq('category_id', categoryId)
    }

    const { data, error } = await q

    if (error) {
      const msg = error.message || ''
      if (isLikelyRlsOrPermissionDenied(error)) {
        return {
          success: false,
          error: SALE_CATALOG_RLS_DENIED_MESSAGE,
          articles: [] as SaleArticleRow[],
          count: 0
        }
      }
      const missing =
        msg.includes('does not exist') || msg.includes('schema cache')
      return {
        success: true,
        articles: [] as SaleArticleRow[],
        count: 0,
        warning: missing
          ? 'Tablas `articles` / `categories` no disponibles en Supabase.'
          : msg
      }
    }

    let rows = (data || []) as Record<string, unknown>[]
    rows = rows.filter((r) => {
      const c = r.categories as { visible?: boolean } | undefined
      return c?.visible === true
    })

    if (search) {
      rows = rows.filter((r) => {
        const name = String(r.name ?? '').toLowerCase()
        const desc = String(r.description ?? '').toLowerCase()
        return name.includes(search) || desc.includes(search)
      })
    }

    if (options?.countOnly) {
      return {
        success: true,
        articles: [],
        count: rows.length,
        warning: null as string | null
      }
    }

    const articles = rows.map((row) => mapArticleRow(row))
    return {
      success: true,
      articles,
      count: articles.length,
      warning: null as string | null
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return {
      success: false,
      error: message,
      articles: [] as SaleArticleRow[],
      count: 0
    }
  }
}
