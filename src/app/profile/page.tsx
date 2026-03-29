'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Body, ButtonRs, Title } from 'rootsy-feparts'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import {
  getUserProfile,
  updateUserProfile,
  type UserProfileDTO
} from '@/app/profile/actions'
import styles from './page.module.css'

function toDateInputValue (iso: string | null): string {
  if (!iso) return ''
  const d = iso.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
}

function formatLastLogin (iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function Page () {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  )

  const [email, setEmail] = useState<string | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [timezone, setTimezone] = useState('')
  const [language, setLanguage] = useState('')

  const applyDto = useCallback((p: UserProfileDTO) => {
    setEmail(p.email)
    setIsEmailVerified(p.isEmailVerified)
    setIsPhoneVerified(p.isPhoneVerified)
    setLastLoginAt(p.lastLoginAt)
    setFirstName(p.firstName)
    setLastName(p.lastName)
    setPhone(p.phone ?? '')
    setImageUrl(p.imageUrl ?? '')
    setAddress(p.address ?? '')
    setCity(p.city ?? '')
    setState(p.state ?? '')
    setCountry(p.country ?? '')
    setPostalCode(p.postalCode ?? '')
    setDateOfBirth(toDateInputValue(p.dateOfBirth))
    setGender(p.gender ?? '')
    setBio(p.bio ?? '')
    setWebsite(p.website ?? '')
    setTimezone(p.timezone ?? 'America/Argentina/Buenos_Aires')
    setLanguage(p.language ?? 'es')
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setBanner(null)
      try {
        const p = await getUserProfile()
        if (!cancelled) applyDto(p)
      } catch {
        if (!cancelled) {
          setBanner({ type: 'err', text: 'No se pudo cargar tu perfil.' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applyDto])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user?.id) return
    if (!file.type.startsWith('image/')) {
      setBanner({ type: 'err', text: 'Elegí un archivo de imagen.' })
      return
    }
    setUploadingAvatar(true)
    setBanner(null)
    const parts = file.name.split('.')
    const ext =
      parts.length > 1
        ? parts.pop()!.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'jpg'
        : 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg'
      })
    if (upErr) {
      setBanner({
        type: 'err',
        text: upErr.message || 'No se pudo subir la imagen.'
      })
      setUploadingAvatar(false)
      return
    }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = pub.publicUrl
    setImageUrl(publicUrl)
    const res = await updateUserProfile({ imageUrl: publicUrl })
    setUploadingAvatar(false)
    if (!res.success) {
      setBanner({
        type: 'err',
        text: res.error || 'La imagen se subió pero no se pudo guardar en el perfil.'
      })
      return
    }
    setBanner({ type: 'ok', text: 'Foto de perfil actualizada.' })
    const p = await getUserProfile()
    applyDto(p)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    const res = await updateUserProfile({
      firstName,
      lastName,
      phone: phone || null,
      imageUrl: imageUrl || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
      postalCode: postalCode || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      bio: bio || null,
      website: website || null,
      timezone,
      language
    })
    setSaving(false)
    if (res.success) {
      setBanner({ type: 'ok', text: 'Cambios guardados.' })
      const p = await getUserProfile()
      applyDto(p)
    } else {
      setBanner({
        type: 'err',
        text: res.error || 'No se pudieron guardar los cambios.'
      })
    }
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>
          <Body size='md' color='white'>
            Cargando tu cuenta…
          </Body>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <ButtonRs
            type='button'
            hierarchy='secondary'
            inverted
            onPress={() => router.push('/home')}
          >
            ← Volver a mis puntos de venta
          </ButtonRs>
        </div>

        <div className={styles.pageTitle}>
          <Title color='white'>Mi cuenta</Title>
        </div>
        <div className={styles.lead}>
          <Body size='sm' color='white'>
            Datos de tu usuario en Rootsy. El correo se gestiona con tu inicio de sesión.
          </Body>
        </div>

        {banner ? (
          <div
            className={`${styles.banner} ${
              banner.type === 'ok' ? styles.bannerOk : styles.bannerErr
            }`}
            role='status'
          >
            {banner.text}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Cuenta y seguridad</div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <span className={styles.label}>Correo electrónico</span>
                <div className={styles.readonly}>{email || '—'}</div>
                <span className={styles.label} style={{ marginTop: 8 }}>
                  Verificación email
                  <span
                    className={`${styles.badge} ${
                      isEmailVerified ? styles.badgeOk : styles.badgeNo
                    }`}
                  >
                    {isEmailVerified ? 'Verificado' : 'Pendiente'}
                  </span>
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Último acceso</span>
                <div className={styles.readonly}>{formatLastLogin(lastLoginAt)}</div>
                <span className={styles.label} style={{ marginTop: 8 }}>
                  Teléfono verificado
                  <span
                    className={`${styles.badge} ${
                      isPhoneVerified ? styles.badgeOk : styles.badgeNo
                    }`}
                  >
                    {isPhoneVerified ? 'Sí' : 'No'}
                  </span>
                </span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Identidad</div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='firstName'>
                  Nombre
                </label>
                <input
                  id='firstName'
                  className={styles.select}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete='given-name'
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='lastName'>
                  Apellido
                </label>
                <input
                  id='lastName'
                  className={styles.select}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete='family-name'
                />
              </div>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.label}>Foto de perfil</span>
                <div className={styles.avatarRow}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=''
                      width={96}
                      height={96}
                      className={styles.avatarPreview}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.avatarPreviewPlaceholder}>
                      Sin foto
                    </div>
                  )}
                  <div className={styles.avatarUploadControls}>
                    <input
                      id='avatarFile'
                      className={styles.fileInput}
                      type='file'
                      accept='image/*'
                      disabled={uploadingAvatar || !user?.id}
                      onChange={handleAvatarChange}
                    />
                    <Body size='xs' color='white'>
                      {uploadingAvatar
                        ? 'Subiendo…'
                        : 'Se guarda en Supabase (bucket público avatars).'}
                    </Body>
                  </div>
                </div>
              </div>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label} htmlFor='imageUrl'>
                  URL de foto (opcional)
                </label>
                <input
                  id='imageUrl'
                  className={styles.select}
                  type='url'
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder='https://…'
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='dateOfBirth'>
                  Fecha de nacimiento
                </label>
                <input
                  id='dateOfBirth'
                  className={styles.select}
                  type='date'
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='gender'>
                  Género
                </label>
                <select
                  id='gender'
                  className={styles.select}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value=''>Preferir no decir</option>
                  <option value='female'>Femenino</option>
                  <option value='male'>Masculino</option>
                  <option value='non_binary'>No binario</option>
                  <option value='other'>Otro</option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Contacto</div>
            <div className={styles.grid2}>
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
                  autoComplete='tel'
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='website'>
                  Sitio web
                </label>
                <input
                  id='website'
                  className={styles.select}
                  type='url'
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder='https://…'
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Ubicación</div>
            <div className={styles.grid2}>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label} htmlFor='address'>
                  Dirección
                </label>
                <input
                  id='address'
                  className={styles.select}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete='street-address'
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
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='state'>
                  Provincia / Estado
                </label>
                <input
                  id='state'
                  className={styles.select}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='country'>
                  País
                </label>
                <input
                  id='country'
                  className={styles.select}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  autoComplete='country-name'
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
                  autoComplete='postal-code'
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Preferencias</div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='language'>
                  Idioma de la interfaz
                </label>
                <select
                  id='language'
                  className={styles.select}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value='es'>Español</option>
                  <option value='en'>English</option>
                  <option value='pt'>Português</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='timezone'>
                  Zona horaria
                </label>
                <select
                  id='timezone'
                  className={styles.select}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value='America/Argentina/Buenos_Aires'>
                    Buenos Aires (ART)
                  </option>
                  <option value='America/Santiago'>Santiago</option>
                  <option value='America/Montevideo'>Montevideo</option>
                  <option value='America/Sao_Paulo'>São Paulo</option>
                  <option value='UTC'>UTC</option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Sobre vos</div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor='bio'>
                Bio
              </label>
              <textarea
                id='bio'
                className={styles.textarea}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={2000}
              />
            </div>
          </section>

          <div className={styles.actions}>
            <button type='submit' className={styles.submitBtn} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <ButtonRs
              type='button'
              hierarchy='secondary'
              inverted
              onPress={() => router.push('/home')}
            >
              Cancelar
            </ButtonRs>
          </div>
        </form>
      </div>
    </div>
  )
}

export default withAuth(Page)
