'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import { usePopPermissions } from '@/context/PopPermissionsContext'
import { POP_PERMS } from '@/lib/popPermissionConstants'
import { Body, ButtonRs, Title } from 'rootsy-feparts'
import {
  PopDarkShellLayout,
  POP_SCREEN_DEFAULT_AVATAR
} from '@/components/layouts/PopDarkShellLayout'
import popShellStyles from '@/components/layouts/PopDarkShellLayout.module.css'
import { ARTICLE_DELETE_CONFIRM_PHRASE } from './articleConstants'
import {
  deletePopArticle,
  getPopArticleCategories,
  getPopArticlesTable,
  updatePopArticle,
  type ArticleCategoryOption,
  type ArticleTableRow
} from './actions'
import styles from './page.module.css'

function formatMoney (n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  }).format(n)
}

const Page = () => {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { hasPermissionDef } = usePopPermissions()
  const popId = params?.pop as string | undefined

  const canUpdate = hasPermissionDef(POP_PERMS.ARTICLE_UPDATE)
  const canDelete = hasPermissionDef(POP_PERMS.ARTICLE_DELETE)

  const [popName, setPopName] = useState('')
  const [articles, setArticles] = useState<ArticleTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editRow, setEditRow] = useState<ArticleTableRow | null>(null)
  const [editCategories, setEditCategories] = useState<ArticleCategoryOption[]>(
    []
  )
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    salePrice: '',
    iva: '',
    categoryId: '',
    isActive: true
  })
  const [editBanner, setEditBanner] = useState<string | null>(null)

  const [deleteRow, setDeleteRow] = useState<ArticleTableRow | null>(null)
  const [deleteTyped, setDeleteTyped] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteBanner, setDeleteBanner] = useState<string | null>(null)

  const loadArticles = useCallback(async () => {
    if (!popId) return
    const res = await getPopArticlesTable(popId)
    if (!res.success) {
      setError(res.error || 'Error al cargar')
      if (res.redirect) setTimeout(() => router.push(res.redirect!), 1200)
      return
    }
    setArticles(res.articles)
    if (res.popName) setPopName(res.popName)
    setError(null)
  }, [popId, router])

  useEffect(() => {
    if (!popId) {
      setLoading(false)
      setError('ID de POP no encontrado')
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await loadArticles()
        if (cancelled) return
      } catch {
        if (!cancelled) setError('Error inesperado')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [popId, loadArticles])

  const openEdit = async (row: ArticleTableRow) => {
    if (!popId) return
    setEditBanner(null)
    setEditRow(row)
    setEditForm({
      name: row.name,
      description: row.description,
      salePrice: String(row.salePrice),
      iva: String(row.iva),
      categoryId: row.categoryId,
      isActive: row.isActive
    })
    setEditLoading(true)
    const catRes = await getPopArticleCategories(popId)
    setEditLoading(false)
    if (catRes.success) {
      setEditCategories(catRes.categories)
    } else {
      setEditBanner(catRes.error)
      setEditCategories([])
    }
  }

  const closeEdit = () => {
    setEditRow(null)
    setEditBanner(null)
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!popId || !editRow) return
    setEditSaving(true)
    setEditBanner(null)
    const res = await updatePopArticle(popId, editRow.id, {
      name: editForm.name,
      description: editForm.description,
      salePrice: Number(editForm.salePrice),
      iva: Number(editForm.iva),
      categoryId: editForm.categoryId,
      isActive: editForm.isActive
    })
    setEditSaving(false)
    if (!res.success) {
      setEditBanner(res.error)
      return
    }
    closeEdit()
    await loadArticles()
  }

  const openDelete = (row: ArticleTableRow) => {
    setDeleteBanner(null)
    setDeleteTyped('')
    setDeleteRow(row)
  }

  const closeDelete = () => {
    setDeleteRow(null)
    setDeleteTyped('')
    setDeleteBanner(null)
  }

  const submitDelete = async () => {
    if (!popId || !deleteRow) return
    setDeleteBusy(true)
    setDeleteBanner(null)
    const res = await deletePopArticle(popId, deleteRow.id, deleteTyped)
    setDeleteBusy(false)
    if (!res.success) {
      setDeleteBanner(res.error)
      return
    }
    closeDelete()
    await loadArticles()
  }

  const emptyCols =
    canUpdate || canDelete ? 7 : 6

  const userAvatarSrc =
    user?.user_metadata?.avatar_url || POP_SCREEN_DEFAULT_AVATAR

  if (!popId) {
    return (
      <div style={{ padding: 40, color: '#fff' }}>
        <Body size='md' color='white'>
          ID de POP no encontrado
        </Body>
      </div>
    )
  }

  return (
    <PopDarkShellLayout
      popId={popId}
      sectionTitle='Artículos'
      popName={popName}
      userAvatarSrc={userAvatarSrc}
    >
      {loading ? (
        <div className={popShellStyles.centeredMessage}>
          <Body size='md' color='white'>
            Cargando…
          </Body>
        </div>
      ) : error ? (
        <div className={popShellStyles.centeredMessage}>
          <Body size='md' color='white'>
            {error}
          </Body>
        </div>
      ) : (
        <div className={styles.inner}>
          <div style={{ marginBottom: 20 }}>
            <Title color='white'>Artículos</Title>
            <div className={styles.lead}>
              <Body size='sm' color='white'>
                Listado de artículos del punto de venta.
              </Body>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th className={styles.num}>Precio</th>
                  <th className={styles.num}>IVA %</th>
                  <th>Estado</th>
                  <th>Descripción</th>
                  {(canUpdate || canDelete) ? (
                    <th className={styles.actionsTh}>Acciones</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={emptyCols}>
                      <span className={styles.muted}>
                        <Body size='sm' color='white'>
                          No hay artículos o no tenés permiso de lectura en la tabla
                          según las políticas del servidor.
                        </Body>
                      </span>
                    </td>
                  </tr>
                ) : (
                  articles.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name || '—'}</td>
                      <td>{a.categoryName}</td>
                      <td className={styles.num}>{formatMoney(a.salePrice)}</td>
                      <td className={styles.num}>{a.iva}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${a.isActive ? styles.badgeOn : styles.badgeOff}`}
                        >
                          {a.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.desc} title={a.description}>
                          {a.description || '—'}
                        </span>
                      </td>
                      {(canUpdate || canDelete) ? (
                        <td className={styles.actionsTd}>
                          <div className={styles.rowActions}>
                            {canUpdate ? (
                              <button
                                type='button'
                                className={styles.linkBtn}
                                onClick={() => void openEdit(a)}
                              >
                                Editar
                              </button>
                            ) : null}
                            {canDelete ? (
                              <button
                                type='button'
                                className={styles.dangerBtn}
                                onClick={() => openDelete(a)}
                              >
                                Borrar
                              </button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editRow ? (
        <div
          className={styles.modalBackdrop}
          role='presentation'
          onClick={closeEdit}
        >
          <div
            className={styles.modal}
            role='dialog'
            aria-labelledby='edit-article-title'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id='edit-article-title' className={styles.modalHeading}>
              Editar artículo
            </h2>
            {editBanner ? (
              <div className={styles.modalBanner}>{editBanner}</div>
            ) : null}
            {editLoading ? (
              <Body size='sm' color='white'>
                Cargando categorías…
              </Body>
            ) : (
              <form className={styles.modalForm} onSubmit={submitEdit}>
                <label className={styles.modalLabel}>
                  Nombre
                  <input
                    className={styles.modalInput}
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.modalLabel}>
                  Descripción
                  <textarea
                    className={styles.modalTextarea}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value
                      }))
                    }
                    rows={3}
                  />
                </label>
                <label className={styles.modalLabel}>
                  Categoría
                  <select
                    className={styles.modalInput}
                    value={editForm.categoryId}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        categoryId: e.target.value
                      }))
                    }
                    required
                  >
                    <option value=''>Elegir…</option>
                    {editCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.modalRow}>
                  <label className={styles.modalLabel}>
                    Precio
                    <input
                      className={styles.modalInput}
                      type='number'
                      min={0}
                      step='0.01'
                      value={editForm.salePrice}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          salePrice: e.target.value
                        }))
                      }
                      required
                    />
                  </label>
                  <label className={styles.modalLabel}>
                    IVA %
                    <input
                      className={styles.modalInput}
                      type='number'
                      min={0}
                      step='1'
                      value={editForm.iva}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, iva: e.target.value }))
                      }
                      required
                    />
                  </label>
                </div>
                <label className={styles.modalCheck}>
                  <input
                    type='checkbox'
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        isActive: e.target.checked
                      }))
                    }
                  />
                  <span>Activo</span>
                </label>
                <div className={styles.modalActions}>
                  <ButtonRs
                    type='button'
                    hierarchy='secondary'
                    inverted
                    onPress={closeEdit}
                  >
                    Cancelar
                  </ButtonRs>
                  <button
                    type='submit'
                    className={styles.primaryBtn}
                    disabled={editSaving}
                  >
                    {editSaving ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {deleteRow ? (
        <div
          className={styles.modalBackdrop}
          role='presentation'
          onClick={closeDelete}
        >
          <div
            className={styles.modal}
            role='dialog'
            aria-labelledby='delete-article-title'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id='delete-article-title' className={styles.modalHeading}>
              ¿Eliminar artículo?
            </h2>
            <p className={styles.modalP}>
              Vas a borrar{' '}
              <strong className={styles.modalStrong}>
                {deleteRow.name || 'este artículo'}
              </strong>
              . Esta acción no se puede deshacer desde acá.
            </p>
            <p className={styles.modalP}>
              Para confirmar, escribí{' '}
              <strong className={styles.modalStrong}>
                {ARTICLE_DELETE_CONFIRM_PHRASE}
              </strong>{' '}
              en el campo de abajo.
            </p>
            {deleteBanner ? (
              <div className={styles.modalBannerErr}>{deleteBanner}</div>
            ) : null}
            <input
              className={styles.modalInput}
              autoComplete='off'
              value={deleteTyped}
              onChange={(e) => setDeleteTyped(e.target.value)}
              placeholder={ARTICLE_DELETE_CONFIRM_PHRASE}
            />
            <div className={styles.modalActions}>
              <ButtonRs
                type='button'
                hierarchy='secondary'
                inverted
                onPress={closeDelete}
              >
                Cancelar
              </ButtonRs>
              <button
                type='button'
                className={styles.dangerBtnSolid}
                disabled={
                  deleteBusy ||
                  deleteTyped.trim() !== ARTICLE_DELETE_CONFIRM_PHRASE
                }
                onClick={() => void submitDelete()}
              >
                {deleteBusy ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PopDarkShellLayout>
  )
}

export default withAuth(Page)
