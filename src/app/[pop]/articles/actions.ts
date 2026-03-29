'use server'

import {
  POP_PERMS,
  permissionKeysInclude
} from '@/lib/popPermissionConstants'
import { getPopById, validatePopAccess } from '@/lib/popHelpers'
import { loadPopPermissionsSnapshot } from '@/lib/popPermissionsServer'
import { createClient } from '@/utils/supabase/server'
import { ARTICLE_DELETE_CONFIRM_PHRASE } from './articleConstants'

export type ArticleTableRow = {
  id: string
  name: string
  description: string
  salePrice: number
  iva: number
  categoryId: string
  categoryName: string
  isActive: boolean
}

async function assertArticleReadPermission (popId: string): Promise<
  | { ok: true }
  | { ok: false; error: string; redirect: string }
> {
  const snap = await loadPopPermissionsSnapshot(popId)
  if (
    !permissionKeysInclude(
      snap.keys,
      POP_PERMS.ARTICLE_READ.resource,
      POP_PERMS.ARTICLE_READ.action
    )
  ) {
    return {
      ok: false,
      error:
        'No tenés permiso para ver artículos en este punto de venta.',
      redirect: `/${popId}/menu`
    }
  }
  return { ok: true }
}

async function assertArticleUpdatePermission (popId: string): Promise<boolean> {
  const snap = await loadPopPermissionsSnapshot(popId)
  return permissionKeysInclude(
    snap.keys,
    POP_PERMS.ARTICLE_UPDATE.resource,
    POP_PERMS.ARTICLE_UPDATE.action
  )
}

async function assertArticleDeletePermission (popId: string): Promise<boolean> {
  const snap = await loadPopPermissionsSnapshot(popId)
  return permissionKeysInclude(
    snap.keys,
    POP_PERMS.ARTICLE_DELETE.resource,
    POP_PERMS.ARTICLE_DELETE.action
  )
}

export type ArticleCategoryOption = {
  id: string
  name: string
}

export async function getPopArticleCategories (
  popId: string
): Promise<
  | { success: true; categories: ArticleCategoryOption[] }
  | { success: false; error: string }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || 'Sin acceso' }
    }
    if (!(await assertArticleUpdatePermission(popId))) {
      return { success: false, error: 'Sin permiso para editar artículos.' }
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('pop_id', popId)
      .order('name', { ascending: true })
    if (error) {
      return { success: false, error: error.message }
    }
    const categories: ArticleCategoryOption[] = (data || []).map((c) => ({
      id: String(c.id),
      name: String(c.name ?? '')
    }))
    return { success: true, categories }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export type UpdatePopArticleInput = {
  name: string
  description: string
  salePrice: number
  iva: number
  categoryId: string
  isActive: boolean
}

export async function updatePopArticle (
  popId: string,
  articleId: string,
  input: UpdatePopArticleInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || 'Sin acceso' }
    }
    if (!(await assertArticleUpdatePermission(popId))) {
      return { success: false, error: 'Sin permiso para editar artículos.' }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: 'El nombre no puede quedar vacío.' }
    }
    const salePrice = Number(input.salePrice)
    const iva = Number(input.iva)
    if (!Number.isFinite(salePrice) || salePrice < 0) {
      return { success: false, error: 'Precio inválido.' }
    }
    if (!Number.isFinite(iva) || iva < 0) {
      return { success: false, error: 'IVA inválido.' }
    }
    const categoryId = input.categoryId.trim()
    if (!categoryId) {
      return { success: false, error: 'Elegí una categoría.' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('articles')
      .update({
        name,
        description: input.description.trim(),
        sale_price: salePrice,
        iva,
        category_id: categoryId,
        is_active: input.isActive
      })
      .eq('id', articleId)
      .eq('pop_id', popId)

    if (error) {
      return { success: false, error: error.message || 'No se pudo guardar.' }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function deletePopArticle (
  popId: string,
  articleId: string,
  confirmationTyped: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (confirmationTyped.trim() !== ARTICLE_DELETE_CONFIRM_PHRASE) {
      return {
        success: false,
        error: `Escribí ${ARTICLE_DELETE_CONFIRM_PHRASE} para confirmar el borrado.`
      }
    }
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || 'Sin acceso' }
    }
    if (!(await assertArticleDeletePermission(popId))) {
      return { success: false, error: 'Sin permiso para eliminar artículos.' }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId)
      .eq('pop_id', popId)
    if (error) {
      return { success: false, error: error.message || 'No se pudo eliminar.' }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function getPopArticlesTable (popId: string): Promise<
  | {
      success: true
      articles: ArticleTableRow[]
      popName: string
    }
  | {
      success: false
      error: string
      redirect?: string
      articles: ArticleTableRow[]
      popName?: string
    }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return {
        success: false,
        error: access.error || 'Sin acceso',
        redirect: '/home',
        articles: [],
        popName: ''
      }
    }

    const gate = await assertArticleReadPermission(popId)
    if (!gate.ok) {
      return {
        success: false,
        error: gate.error,
        redirect: gate.redirect,
        articles: [],
        popName: ''
      }
    }

    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? '') : ''

    const supabase = await createClient()
    const { data, error } = await supabase
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
        categories ( id, name )
      `
      )
      .eq('pop_id', popId)
      .order('name', { ascending: true })

    if (error) {
      return {
        success: false,
        error: error.message || 'No se pudieron cargar los artículos.',
        articles: [],
        popName
      }
    }

    const rows = (data || []) as Record<string, unknown>[]
    const articles: ArticleTableRow[] = rows.map((row) => {
      const cat = row.categories as { name?: string } | null | undefined
      return {
        id: String(row.id),
        name: String(row.name ?? ''),
        description: String(row.description ?? ''),
        salePrice: Number(row.sale_price ?? 0) || 0,
        iva: Number(row.iva ?? 0) || 0,
        categoryId: String(row.category_id ?? ''),
        categoryName: cat?.name ? String(cat.name) : '—',
        isActive: Boolean(row.is_active)
      }
    })

    return { success: true, articles, popName }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return {
      success: false,
      error: message,
      articles: [],
      popName: ''
    }
  }
}
