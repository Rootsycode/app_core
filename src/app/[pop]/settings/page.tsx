'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import { Body, ButtonIcon, ButtonRs, Title } from 'rootsy-feparts'
import { SectionHeader } from '@/components/layouts/SectionHeader'
import { ArrowLeftIcon24 } from '@/components/atoms/icons/ArrowLeftIcon24'
import {
  getPopSettingsForEdit,
  updatePopSettings,
  type PopOutletSettingsDTO
} from './actions'
import styles from './page.module.css'

const PLACEHOLDER_USER_IMG =
  'https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq'

/** Misma ruta en Storage → misma URL pública; el navegador cachea. Versión en query fuerza recarga. */
function storagePublicUrlWithCacheBust (publicUrl: string): string {
  const base = publicUrl.split('?')[0]
  return `${base}?v=${Date.now()}`
}

const Page = () => {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const popId = params?.pop as string | undefined

  const [popData, setPopData] = useState<PopOutletSettingsDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadKey, setUploadKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<{
    type: 'ok' | 'err' | 'info'
    text: string
  } | null>(null)

  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [phone, setPhone] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('')
  const [invoiceLogoUrl, setInvoiceLogoUrl] = useState('')

  const applyDto = useCallback((p: PopOutletSettingsDTO) => {
    setName(p.name)
    setCountry(p.country ?? '')
    setState(p.state ?? '')
    setCity(p.city ?? '')
    setStreetAddress(p.streetAddress ?? '')
    setPostalCode(p.postalCode ?? '')
    setPhone(p.phone ?? '')
    setLogoUrl(p.logoUrl ?? '')
    setBackgroundImageUrl(p.backgroundImageUrl ?? '')
    setInvoiceLogoUrl(p.invoiceLogoUrl ?? '')
  }, [])

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
        const result = await getPopSettingsForEdit(popId)
        if (cancelled) return
        if (!result.success) {
          setError(result.error || 'Error al cargar datos')
          if (result.redirect) {
            setTimeout(() => router.push(result.redirect!), 1500)
          }
          return
        }
        setPopData(result.pop)
        applyDto(result.pop)
        if (!result.pop.canUpdate) {
          setBanner({
            type: 'info',
            text: 'Podés ver los datos del punto de venta. Para editarlos necesitás permiso de configuración (settings:update).'
          })
        }
      } catch {
        if (!cancelled) setError('Error inesperado al cargar datos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [popId, router, applyDto])

  const handleBackClick = () => {
    if (popId) router.push(`/${popId}/menu`)
  }

  const uploadPopAsset = async (
    file: File,
    objectBase: 'logo' | 'background' | 'invoice-logo'
  ) => {
    if (!popId) {
      setBanner({ type: 'err', text: 'Falta el identificador del punto de venta.' })
      return
    }
    if (!popData?.canUpdate) {
      setBanner({
        type: 'err',
        text: 'No tenés permiso para subir imágenes en este POP.'
      })
      return
    }
    if (!file.type.startsWith('image/')) {
      setBanner({ type: 'err', text: 'Elegí un archivo de imagen.' })
      return
    }
    const parts = file.name.split('.')
    const ext =
      parts.length > 1
        ? parts.pop()!.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'jpg'
        : 'jpg'
    const path = `${popId}/${objectBase}.${ext}`
    setUploadKey(objectBase)
    setBanner(null)
    try {
      // Quitar objeto anterior si existe: upsert a veces no refresca bien en CDN/cliente con la misma key.
      await supabase.storage.from('pop-assets').remove([path])

      const { error: upErr } = await supabase.storage
        .from('pop-assets')
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg'
        })
      if (upErr) {
        setBanner({
          type: 'err',
          text: upErr.message || 'No se pudo subir la imagen.'
        })
        return
      }
      const { data: pub } = supabase.storage.from('pop-assets').getPublicUrl(path)
      const publicUrl = storagePublicUrlWithCacheBust(pub.publicUrl)

      if (objectBase === 'logo') setLogoUrl(publicUrl)
      if (objectBase === 'background') setBackgroundImageUrl(publicUrl)
      if (objectBase === 'invoice-logo') setInvoiceLogoUrl(publicUrl)

      const patch =
        objectBase === 'logo'
          ? { logoUrl: publicUrl }
          : objectBase === 'background'
            ? { backgroundImageUrl: publicUrl }
            : { invoiceLogoUrl: publicUrl }

      const res = await updatePopSettings(popId, patch)
      if (!res.success) {
        setBanner({
          type: 'err',
          text: res.error || 'La imagen se subió pero no se pudo guardar la URL.'
        })
        return
      }
      setBanner({ type: 'ok', text: 'Imagen actualizada.' })
      const fresh = await getPopSettingsForEdit(popId)
      if (fresh.success) {
        setPopData(fresh.pop)
        applyDto(fresh.pop)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error inesperado al subir la imagen.'
      setBanner({ type: 'err', text: msg })
    } finally {
      setUploadKey(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!popId || !popData?.canUpdate) return
    setSaving(true)
    setBanner(null)
    const res = await updatePopSettings(popId, {
      name: name.trim(),
      country: country || null,
      state: state || null,
      city: city || null,
      streetAddress: streetAddress || null,
      postalCode: postalCode || null,
      phone: phone || null,
      logoUrl: logoUrl || null,
      backgroundImageUrl: backgroundImageUrl || null,
      invoiceLogoUrl: invoiceLogoUrl || null
    })
    setSaving(false)
    if (res.success) {
      setBanner({ type: 'ok', text: 'Cambios guardados.' })
      const fresh = await getPopSettingsForEdit(popId)
      if (fresh.success) {
        setPopData(fresh.pop)
        applyDto(fresh.pop)
      }
    } else {
      setBanner({
        type: 'err',
        text: res.error || 'No se pudieron guardar los cambios.'
      })
    }
  }

  if (loading) {
    return (
      <div className={styles.grid}>
        <div style={{ padding: '40px', textAlign: 'center', zIndex: 1 }}>
          <Body size='md' color='white'>
            Cargando…
          </Body>
        </div>
      </div>
    )
  }

  if (error || !popData) {
    return (
      <div className={styles.grid}>
        <div style={{ padding: '40px', textAlign: 'center', zIndex: 1 }}>
          <Body size='md' color='white'>
            {error || 'No se encontraron datos del POP'}
          </Body>
        </div>
      </div>
    )
  }

  const canEdit = popData.canUpdate
  const busyUpload = uploadKey !== null

  return (
    <div className={styles.grid}>
      <SectionHeader
        sectionName='Settings'
        popName={popData.name}
        userImg={{
          src: user?.user_metadata?.avatar_url || PLACEHOLDER_USER_IMG,
          alt: 'Usuario'
        }}
        buttonsLeft={
          <ButtonIcon
            icon={<ArrowLeftIcon24 />}
            onPress={handleBackClick}
          />
        }
      />
      <main className={styles.main}>
        <div className={styles.inner}>
          <div style={{ marginBottom: 20 }}>
            <Title color='white'>Punto de venta</Title>
            <div className={styles.lead}>
              <Body size='sm' color='white'>
                Nombre, domicilio e imágenes de marca. Los cambios se guardan en tu POP.
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

          <form onSubmit={handleSubmit}>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Datos generales</div>
              <div className={styles.grid2}>
                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label} htmlFor='popName'>
                    Nombre del punto de venta
                  </label>
                  <input
                    id='popName'
                    className={styles.select}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit}
                    autoComplete='organization'
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>Domicilio y contacto</div>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor='country'>
                    País
                  </label>
                  <input
                    id='country'
                    className={styles.select}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={!canEdit}
                    autoComplete='country-name'
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor='state'>
                    Provincia / estado
                  </label>
                  <input
                    id='state'
                    className={styles.select}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={!canEdit}
                    autoComplete='address-level1'
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor='city'>
                    Ciudad
                  </label>
                  <input
                    id='city'
                    className={styles.select}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!canEdit}
                    autoComplete='address-level2'
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor='postalCode'>
                    Código postal
                  </label>
                  <input
                    id='postalCode'
                    className={styles.select}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    disabled={!canEdit}
                    autoComplete='postal-code'
                  />
                </div>
                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label} htmlFor='street'>
                    Domicilio (calle y número)
                  </label>
                  <input
                    id='street'
                    className={styles.select}
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    disabled={!canEdit}
                    autoComplete='street-address'
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor='phone'>
                    Teléfono
                  </label>
                  <input
                    id='phone'
                    className={styles.select}
                    type='tel'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!canEdit}
                    autoComplete='tel'
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>Imágenes de marca</div>
              <div className={styles.hint}>
                <Body size='xs' color='white'>
                  Bucket público pop-assets, carpeta {popId}.
                </Body>
              </div>

              <div className={styles.field} style={{ marginBottom: 24 }}>
                <span className={styles.label}>Logo de la empresa</span>
                <div className={styles.imageRow}>
                  {logoUrl ? (
                    <Image
                      key={logoUrl}
                      src={logoUrl}
                      alt='Logo'
                      width={120}
                      height={120}
                      className={styles.preview}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.previewPlaceholder}>Sin logo</div>
                  )}
                  <div className={styles.uploadCol}>
                    <input
                      className={styles.fileInput}
                      type='file'
                      accept='image/*'
                      disabled={!canEdit || busyUpload}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (f) void uploadPopAsset(f, 'logo')
                      }}
                    />
                    <Body size='xs' color='white'>
                      {uploadKey === 'logo' ? 'Subiendo…' : ' '}
                    </Body>
                  </div>
                </div>
                <label className={styles.label} htmlFor='logoUrl' style={{ marginTop: 12 }}>
                  URL del logo (opcional)
                </label>
                <input
                  id='logoUrl'
                  className={styles.select}
                  type='url'
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder='https://…'
                />
              </div>

              <div className={styles.field} style={{ marginBottom: 24 }}>
                <span className={styles.label}>Fondo de pantalla</span>
                <div className={styles.imageRow}>
                  {backgroundImageUrl ? (
                    <Image
                      key={backgroundImageUrl}
                      src={backgroundImageUrl}
                      alt='Fondo'
                      width={280}
                      height={100}
                      className={styles.previewWide}
                      unoptimized
                    />
                  ) : (
                    <div
                      className={styles.previewPlaceholder}
                      style={{ width: '100%', maxWidth: 280, height: 100 }}
                    >
                      Sin imagen
                    </div>
                  )}
                  <div className={styles.uploadCol}>
                    <input
                      className={styles.fileInput}
                      type='file'
                      accept='image/*'
                      disabled={!canEdit || busyUpload}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (f) void uploadPopAsset(f, 'background')
                      }}
                    />
                    <Body size='xs' color='white'>
                      {uploadKey === 'background' ? 'Subiendo…' : ' '}
                    </Body>
                  </div>
                </div>
                <label
                  className={styles.label}
                  htmlFor='bgUrl'
                  style={{ marginTop: 12 }}
                >
                  URL de fondo (opcional)
                </label>
                <input
                  id='bgUrl'
                  className={styles.select}
                  type='url'
                  value={backgroundImageUrl}
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder='https://…'
                />
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Logo para facturas</span>
                <div className={styles.imageRow}>
                  {invoiceLogoUrl ? (
                    <Image
                      key={invoiceLogoUrl}
                      src={invoiceLogoUrl}
                      alt='Logo facturas'
                      width={120}
                      height={120}
                      className={styles.preview}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.previewPlaceholder}>Sin logo</div>
                  )}
                  <div className={styles.uploadCol}>
                    <input
                      className={styles.fileInput}
                      type='file'
                      accept='image/*'
                      disabled={!canEdit || busyUpload}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (f) void uploadPopAsset(f, 'invoice-logo')
                      }}
                    />
                    <Body size='xs' color='white'>
                      {uploadKey === 'invoice-logo' ? 'Subiendo…' : ' '}
                    </Body>
                  </div>
                </div>
                <label
                  className={styles.label}
                  htmlFor='invUrl'
                  style={{ marginTop: 12 }}
                >
                  URL logo facturas (opcional)
                </label>
                <input
                  id='invUrl'
                  className={styles.select}
                  type='url'
                  value={invoiceLogoUrl}
                  onChange={(e) => setInvoiceLogoUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder='https://…'
                />
              </div>
            </section>

            {canEdit ? (
              <div className={styles.actions}>
                <button
                  type='submit'
                  className={styles.submitBtn}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <ButtonRs
                  type='button'
                  hierarchy='secondary'
                  inverted
                  onPress={() => router.push(`/${popId}/menu`)}
                >
                  Volver al menú
                </ButtonRs>
              </div>
            ) : (
              <div className={styles.actions}>
                <ButtonRs
                  type='button'
                  hierarchy='secondary'
                  inverted
                  onPress={() => router.push(`/${popId}/menu`)}
                >
                  Volver al menú
                </ButtonRs>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  )
}

export default withAuth(Page)
