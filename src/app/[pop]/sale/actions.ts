'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { validatePopAccess } from '@/lib/popHelpers'

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

/**
 * Categorías visibles en ventas (`visible = true`) para el POP.
 */
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

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data: rows, error } = await supabase
      .from('categories')
      .select('id,name,visible,sort_order')
      .eq('pop_id', popId)
      .eq('visible', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      const msg = error.message || ''
      const missing =
        msg.includes('does not exist') || msg.includes('schema cache')
      return {
        success: true,
        categories: [] as SaleCategoryRow[],
        source: 'categories' as const,
        warning: missing
          ? 'No existe la tabla `categories` en Supabase. Ejecutá la migración correspondiente.'
          : msg
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
      warning: null as string | null
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

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

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
