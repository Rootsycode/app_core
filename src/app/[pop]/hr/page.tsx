'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import { Body, ButtonRs, Title } from 'rootsy-feparts'
import {
  PopDarkShellLayout,
  POP_SCREEN_DEFAULT_AVATAR
} from '@/components/layouts/PopDarkShellLayout'
import popShellStyles from '@/components/layouts/PopDarkShellLayout.module.css'
import {
  deactivatePopMember,
  deletePopRole,
  getPopHrDashboard,
  getRolePermissionsEditorData,
  inviteUserToPop,
  revokePopInvitation,
  savePopRolePermissions,
  type MemberRow,
  type PendingInviteRow,
  type PermissionCatalogRow,
  type PopRoleRow
} from './actions'
import styles from './page.module.css'

function groupMembersByRole (members: MemberRow[]): [string, MemberRow[]][] {
  const m = new Map<string, MemberRow[]>()
  for (const mem of members) {
    const key = mem.roleDisplayName || '—'
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(mem)
  }
  const entries = [...m.entries()]
  entries.sort((a, b) => {
    if (a[0] === 'Propietario') return -1
    if (b[0] === 'Propietario') return 1
    return a[0].localeCompare(b[0], 'es')
  })
  return entries
}

const Page = () => {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const popId = params?.pop as string | undefined

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [popName, setPopName] = useState('')
  const [canManageInvites, setCanManageInvites] = useState(false)
  const [roles, setRoles] = useState<PopRoleRow[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [pending, setPending] = useState<PendingInviteRow[]>([])
  const [banner, setBanner] = useState<{
    type: 'ok' | 'err' | 'info'
    text: string
  } | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviting, setInviting] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [actionKey, setActionKey] = useState<string | null>(null)

  const [permModalRole, setPermModalRole] = useState<{
    id: string
    displayName: string
    name: string
  } | null>(null)
  const [permModalList, setPermModalList] = useState<PermissionCatalogRow[]>([])
  const [permModalSelected, setPermModalSelected] = useState<string[]>([])
  const [permModalLoading, setPermModalLoading] = useState(false)
  const [permModalSaving, setPermModalSaving] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (!popId) return
    const res = await getPopHrDashboard(popId)
    if (!res.success) {
      setError(res.error)
      if (res.redirect) setTimeout(() => router.push(res.redirect!), 1600)
      return
    }
    setPopName(res.popName)
    setCanManageInvites(res.canManageInvites)
    setRoles(res.roles)
    setMembers(res.members)
    setPending(res.pendingInvites)
    setInviteRoleId((prev) => {
      if (prev) return prev
      const assignable = res.roles.find((r) => r.name !== 'owner')
      return assignable?.id ?? ''
    })
  }, [popId, router])

  useEffect(() => {
    if (!popId) {
      setLoading(false)
      setError('ID de POP no encontrado')
      return
    }
    let c = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await loadDashboard()
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [popId, loadDashboard])

  const groupedMembers = useMemo(() => groupMembersByRole(members), [members])
  const assignableRoles = useMemo(
    () => roles.filter((r) => r.name !== 'owner'),
    [roles]
  )

  const permissionsByResource = useMemo(() => {
    const m = new Map<string, PermissionCatalogRow[]>()
    for (const p of permModalList) {
      if (!m.has(p.resource)) m.set(p.resource, [])
      m.get(p.resource)!.push(p)
    }
    return [...m.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], 'es', { sensitivity: 'base' })
    )
  }, [permModalList])

  const closePermModal = () => {
    setPermModalRole(null)
    setPermModalList([])
    setPermModalSelected([])
    setPermModalLoading(false)
    setPermModalSaving(false)
  }

  const handleOpenEditRole = async (r: PopRoleRow) => {
    if (!popId || !r.popId) return
    setPermModalLoading(true)
    setPermModalRole({ id: r.id, displayName: r.displayName, name: r.name })
    setPermModalList([])
    setPermModalSelected([])
    const res = await getRolePermissionsEditorData(popId, r.id)
    setPermModalLoading(false)
    if (!res.success) {
      closePermModal()
      setBanner({ type: 'err', text: res.error })
      return
    }
    setPermModalRole(res.role)
    setPermModalList(res.permissions)
    setPermModalSelected([...res.selectedPermissionIds])
  }

  const togglePermSelection = (permissionId: string) => {
    setPermModalSelected((prev) =>
      prev.includes(permissionId)
        ? prev.filter((x) => x !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSaveRolePermissions = async () => {
    if (!popId || !permModalRole) return
    setPermModalSaving(true)
    const res = await savePopRolePermissions(popId, permModalRole.id, permModalSelected)
    setPermModalSaving(false)
    if (!res.success) {
      setBanner({ type: 'err', text: res.error })
      return
    }
    setBanner({ type: 'ok', text: 'Permisos del rol actualizados.' })
    closePermModal()
    await loadDashboard()
  }

  const handleDeleteRole = async (r: PopRoleRow) => {
    if (!popId || !r.popId) return
    const ok = window.confirm(
      `¿Eliminar el rol "${r.displayName}"? Se quitarán sus permisos y no podrá usarse en nuevas invitaciones.`
    )
    if (!ok) return
    setActionKey(`del-role-${r.id}`)
    const res = await deletePopRole(popId, r.id)
    setActionKey(null)
    if (!res.success) {
      setBanner({ type: 'err', text: res.error })
      return
    }
    setBanner({ type: 'ok', text: 'Rol eliminado.' })
    await loadDashboard()
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!popId || !canManageInvites) return
    setInviting(true)
    setBanner(null)
    setLastInviteUrl(null)
    const res = await inviteUserToPop(
      popId,
      inviteEmail,
      inviteRoleId,
      inviteMessage || null
    )
    setInviting(false)
    if (!res.success) {
      setBanner({ type: 'err', text: res.error })
      return
    }
    setLastInviteUrl(res.inviteUrl)
    setInviteEmail('')
    setInviteMessage('')
    let bannerText: string
    if (res.emailSent) {
      bannerText = 'Invitación enviada por correo.'
    } else if (!res.resendConfigured) {
      bannerText =
        'Invitación creada. No hay RESEND_API_KEY en el servidor: no se envía correo automático. Compartí el enlace de abajo con la persona invitada.'
    } else if (res.emailError) {
      bannerText = `Invitación creada pero Resend rechazó o falló el envío: ${res.emailError}. Revisá dominio verificado y RESEND_FROM en el panel de Resend, carpeta de spam, y compartí el enlace manualmente.`
    } else {
      bannerText =
        'Invitación creada pero no se pudo confirmar el envío del correo. Compartí el enlace de abajo.'
    }
    setBanner({ type: 'ok', text: bannerText })
    await loadDashboard()
  }

  const handleRevoke = async (id: string) => {
    if (!popId) return
    setActionKey(`revoke-${id}`)
    const res = await revokePopInvitation(popId, id)
    setActionKey(null)
    if (!res.success) {
      setBanner({ type: 'err', text: res.error || 'No se pudo revocar.' })
      return
    }
    setBanner({ type: 'ok', text: 'Invitación revocada.' })
    await loadDashboard()
  }

  const handleDeactivate = async (userId: string) => {
    if (!popId) return
    setActionKey(`deact-${userId}`)
    const res = await deactivatePopMember(popId, userId)
    setActionKey(null)
    if (!res.success) {
      setBanner({ type: 'err', text: res.error || 'No se pudo quitar al miembro.' })
      return
    }
    setBanner({ type: 'ok', text: 'Usuario desvinculado del POP.' })
    await loadDashboard()
  }

  const copyInviteUrl = () => {
    if (!lastInviteUrl) return
    void navigator.clipboard.writeText(lastInviteUrl)
    setBanner({ type: 'ok', text: 'Enlace copiado al portapapeles.' })
  }

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
      sectionTitle='RRHH'
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
            <Title color='white'>Recursos humanos</Title>
            <div className={styles.lead}>
              <Body size='sm' color='white'>
                Roles del punto de venta y personas con acceso. Las invitaciones las gestiona el
                dueño del POP.
              </Body>
            </div>
          </div>

          {banner ? (
            <div
              className={`${styles.banner} ${
                banner.type === 'ok'
                  ? styles.bannerOk
                  : banner.type === 'info'
                    ? styles.bannerInfo
                    : styles.bannerErr
              }`}
              role='status'
            >
              {banner.text}
            </div>
          ) : null}

          {lastInviteUrl ? (
            <div className={`${styles.banner} ${styles.bannerInfo}`}>
              <Body size='sm' color='white'>
                Enlace de invitación:
              </Body>
              <p className={styles.mono}>{lastInviteUrl}</p>
              <button type='button' className={styles.ghostBtn} onClick={copyInviteUrl}>
                Copiar enlace
              </button>
            </div>
          ) : null}

          <div className={styles.columns}>
            <div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Roles</div>
                {roles.length === 0 ? (
                  <Body size='sm' color='white'>
                    No hay roles cargados.
                  </Body>
                ) : (
                  roles.map((r) => (
                    <div key={r.id} className={styles.roleRow}>
                      <div className={styles.roleRowMain}>
                        <span>{r.displayName}</span>
                        <span className={styles.roleRowMeta}>
                          {r.popId ? 'Rol del punto de venta' : 'Rol de sistema (plantilla)'}
                        </span>
                      </div>
                      <div className={styles.roleRowAside}>
                        {r.popId ? (
                          <span className={styles.roleRowMeta}>POP</span>
                        ) : (
                          <span className={styles.roleRowMeta}>Sistema</span>
                        )}
                        {canManageInvites && r.popId ? (
                          <div className={styles.roleActions}>
                            <button
                              type='button'
                              className={styles.ghostBtn}
                              disabled={
                                actionKey?.startsWith('del-role-') ||
                                permModalLoading ||
                                permModalSaving
                              }
                              onClick={() => void handleOpenEditRole(r)}
                            >
                              Editar
                            </button>
                            <button
                              type='button'
                              className={styles.ghostBtnDanger}
                              disabled={
                                actionKey?.startsWith('del-role-') ||
                                permModalLoading ||
                                permModalSaving
                              }
                              onClick={() => void handleDeleteRole(r)}
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canManageInvites ? (
                <>
                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Nueva invitación</div>
                    <form onSubmit={handleInvite}>
                      {assignableRoles.length === 0 ? (
                        <Body size='sm' color='white'>
                          No hay roles asignables (además del propietario). Creá roles en la base o
                          contactá soporte.
                        </Body>
                      ) : (
                        <>
                          <div className={styles.field}>
                            <label className={styles.label} htmlFor='invEmail'>
                              Correo electrónico
                            </label>
                            <input
                              id='invEmail'
                              className={styles.input}
                              type='email'
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder='nombre@ejemplo.com'
                              autoComplete='email'
                              required
                            />
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label} htmlFor='invRole'>
                              Rol
                            </label>
                            <select
                              id='invRole'
                              className={styles.select}
                              value={inviteRoleId}
                              onChange={(e) => setInviteRoleId(e.target.value)}
                              required
                            >
                              {assignableRoles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.displayName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label} htmlFor='invMsg'>
                              Mensaje (opcional)
                            </label>
                            <textarea
                              id='invMsg'
                              className={styles.textarea}
                              value={inviteMessage}
                              onChange={(e) => setInviteMessage(e.target.value)}
                              placeholder='Si querés podés enviarle un mensaje'
                            />
                          </div>
                          <button
                            type='submit'
                            className={styles.primaryBtn}
                            disabled={inviting || assignableRoles.length === 0}
                          >
                            {inviting ? 'Enviando…' : 'Enviar invitación'}
                          </button>
                        </>
                      )}
                    </form>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Invitaciones pendientes</div>
                    {pending.length === 0 ? (
                      <Body size='sm' color='white'>
                        No hay invitaciones pendientes.
                      </Body>
                    ) : (
                      pending.map((p) => (
                        <div key={p.id} className={styles.pendingRow}>
                          <div>
                            <div>{p.email}</div>
                            <div className={styles.memberMeta}>{p.roleDisplayName}</div>
                          </div>
                          <button
                            type='button'
                            className={styles.ghostBtn}
                            disabled={actionKey === `revoke-${p.id}`}
                            onClick={() => void handleRevoke(p.id)}
                          >
                            Revocar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.card}>
                  <Body size='sm' color='white'>
                    Solo el dueño del punto de venta puede enviar invitaciones y ver las pendientes.
                  </Body>
                </div>
              )}
            </div>

            <div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Equipo por rol</div>
                {groupedMembers.map(([roleLabel, list]) => (
                  <div key={roleLabel}>
                    <div className={styles.groupTitle}>{roleLabel}</div>
                    {list.map((mem) => (
                      <div key={`${mem.userId}-${roleLabel}`} className={styles.memberRow}>
                        <div className={styles.memberLeft}>
                          {mem.imageUrl ? (
                            <Image
                              src={mem.imageUrl}
                              alt=''
                              width={40}
                              height={40}
                              className={styles.avatar}
                              unoptimized
                            />
                          ) : (
                            <div
                              className={styles.avatar}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12
                              }}
                            >
                              {(mem.firstName || mem.lastName || '?').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div>
                              {`${mem.firstName} ${mem.lastName}`.trim() || 'Sin nombre'}
                            </div>
                            {mem.invitedAt ? (
                              <div className={styles.memberMeta}>
                                Desde {new Date(mem.invitedAt).toLocaleDateString('es-AR')}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {canManageInvites && !mem.isOwner ? (
                          <button
                            type='button'
                            className={styles.ghostBtn}
                            disabled={actionKey === `deact-${mem.userId}`}
                            onClick={() => void handleDeactivate(mem.userId)}
                          >
                            Quitar
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <ButtonRs
                type='button'
                hierarchy='secondary'
                inverted
                onPress={() => (popId ? router.push(`/${popId}/menu`) : undefined)}
              >
                Volver al menú
              </ButtonRs>
            </div>
          </div>
        </div>
      )}

      {permModalRole ? (
        <div
          className={styles.modalBackdrop}
          role='presentation'
          onClick={(e) => {
            if (e.target === e.currentTarget && !permModalSaving) closePermModal()
          }}
        >
          <div
            className={styles.modalDialog}
            role='dialog'
            aria-labelledby='perm-modal-title'
            aria-modal='true'
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 id='perm-modal-title' className={styles.modalTitle}>
                Permisos del rol
              </h2>
              <p className={styles.modalSub}>
                {permModalLoading ? 'Cargando…' : permModalRole.displayName}
              </p>
            </div>
            <div className={styles.modalBody}>
              {permModalLoading ? (
                <Body size='sm' color='white'>
                  Obteniendo permisos disponibles…
                </Body>
              ) : permissionsByResource.length === 0 ? (
                <Body size='sm' color='white'>
                  No hay permisos definidos en el catálogo. Agregá filas en la tabla{' '}
                  <code>permissions</code> en Supabase.
                </Body>
              ) : (
                permissionsByResource.map(([resource, list]) => (
                  <div key={resource}>
                    <div className={styles.modalResource}>{resource}</div>
                    {list.map((p) => (
                      <div key={p.id} className={styles.permRow}>
                        <input
                          id={`perm-${p.id}`}
                          type='checkbox'
                          checked={permModalSelected.includes(p.id)}
                          onChange={() => togglePermSelection(p.id)}
                        />
                        <label className={styles.permLabel} htmlFor={`perm-${p.id}`}>
                          <span>{p.action}</span>
                          {p.description ? (
                            <span className={styles.permDesc}>{p.description}</span>
                          ) : null}
                        </label>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div className={styles.modalFoot}>
              <button
                type='button'
                className={styles.secondaryBtn}
                disabled={permModalSaving || permModalLoading}
                onClick={closePermModal}
              >
                Cancelar
              </button>
              <button
                type='button'
                className={styles.primaryBtn}
                disabled={permModalSaving || permModalLoading}
                onClick={() => void handleSaveRolePermissions()}
              >
                {permModalSaving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PopDarkShellLayout>
  )
}

export default withAuth(Page)
