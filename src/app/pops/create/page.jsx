'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Body, ButtonRs, Form, TextField, Title, Link, RadioGroup, Radio } from 'rootsy-feparts'
import { createPop } from '@/lib/popHelpers'
import { RootsyLogo } from '@/components/atoms/RootsyLogo'
import styles from './page.module.css'

const BUSINESS_TYPES_SKELETON_COUNT = 5

const CreatePopPage = () => {
  const router = useRouter()
  const [popName, setPopName] = useState('')
  const [selectedBusinessType, setSelectedBusinessType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [businessTypes, setBusinessTypes] = useState([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [fieldErrors, setFieldErrors] = useState({
    popName: '',
    businessType: ''
  })
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    const loadBusinessTypes = async () => {
      try {
        const response = await fetch('/api/subscription/business-types')
        if (response.ok) {
          const data = await response.json()
          setBusinessTypes(data || [])
        }
      } catch {
      } finally {
        setLoadingTypes(false)
      }
    }
    loadBusinessTypes()
  }, [])

  const validateField = (fieldName, value) => {
    let error = ''

    if (fieldName === 'popName') {
      if (!value || value.trim() === '') {
        error = 'El nombre del punto de venta es requerido'
      } else if (value.trim().length < 3) {
        error = 'El nombre debe tener al menos 3 caracteres'
      } else if (value.trim().length > 100) {
        error = 'El nombre no puede tener más de 100 caracteres'
      }
    }

    setFieldErrors((prev) => {
      if (prev[fieldName] && !error) {
        return { ...prev, [fieldName]: '' }
      }
      if (error) {
        return { ...prev, [fieldName]: error }
      }
      return prev
    })
  }

  const validateForm = (name) => {
    const errors = {
      popName: '',
      businessType: ''
    }
    let isValid = true

    if (!name || name.trim() === '') {
      errors.popName = 'El nombre del punto de venta es requerido'
      isValid = false
    } else if (name.trim().length < 3) {
      errors.popName = 'El nombre debe tener al menos 3 caracteres'
      isValid = false
    } else if (name.trim().length > 100) {
      errors.popName = 'El nombre no puede tener más de 100 caracteres'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleCreatePop = async (e) => {
    e.preventDefault()
    isSubmittingRef.current = true
    setLoading(true)
    setError('')
    setSuccess(false)

    const name = popName.trim()
    const businessType = selectedBusinessType

    const isValid = validateForm(name)
    if (!isValid) {
      setTimeout(() => {
        isSubmittingRef.current = false
        setLoading(false)
        setFieldErrors((currentErrors) => {
          const firstErrorField = Object.keys(currentErrors).find(
            (key) => currentErrors[key]
          )
          if (firstErrorField) {
            setTimeout(() => {
              const fieldElement = document.querySelector(
                `[name="${firstErrorField}"]`
              )
              if (fieldElement) {
                fieldElement.focus()
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }, 50)
          }
          return currentErrors
        })
      }, 100)
      return
    }

    try {
      const result = await createPop({
        name: name,
        businessTypeId: businessType || undefined
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/home')
        }, 2000)
      } else {
        setError(result.details || result.error || 'Error al crear el punto de venta')
      }
    } catch (err) {
      setError(err.message || 'Error inesperado al crear el punto de venta')
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.hero} aria-label='Rootsy'>
          <div className={styles.heroContent}>
            <RootsyLogo
              className={styles.heroLogo}
              width={280}
              height={56}
              textColor='#ffffff'
              align='left'
            />
            <span className={styles.heroEyebrow}>Nuevo punto de venta</span>
            <Title component='h2' size='sm' color='white' className={styles.heroTitle}>
              Un solo lugar para vender, controlar stock y crecer.
            </Title>
            <Body size='sm' color='white' className={styles.heroLead}>
              Configurá tu espacio en minutos. Probá todas las funciones{' '}
              <strong>7 días gratis</strong>, sin tarjeta.
            </Body>
            <ul className={styles.heroBullets}>
              <li>
                <span className={styles.bulletIcon} aria-hidden />
                Operación centralizada y reportes claros
              </li>
              <li>
                <span className={styles.bulletIcon} aria-hidden />
                Elegí el tipo de negocio que mejor encaje
              </li>
              <li>
                <span className={styles.bulletIcon} aria-hidden />
                Cambiá de plan cuando lo necesites
              </li>
            </ul>
            <p className={styles.heroTagline}>Sistema de gestión online</p>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.panel}>
            <nav className={styles.panelNav} aria-label='Navegación'>
              <Link
                className={styles.backLink}
                onPress={() => router.push('/home')}
              >
                ← Volver al perfil
              </Link>
            </nav>

            <header className={styles.panelHeader}>
              <span className={styles.trialPill}>7 días de prueba</span>
              <Title component='h1' size='xs' className={styles.panelTitle}>
                Crear punto de venta
              </Title>
              <Body size='sm' className={styles.lead}>
                Nombre público de tu local o sucursal. Más adelante podés sumar
                suscripción y addons.
              </Body>
            </header>

            {success ? (
              <div className={styles.successState} role='status' aria-live='polite'>
                <div className={styles.successIcon} aria-hidden />
                <Title
                  component='h2'
                  size='xs'
                  className={styles.successTitle}
                  color='success'
                >
                  ¡Punto de venta creado!
                </Title>
                <Body size='sm' className={styles.successSub}>
                  Redirigiendo a tu perfil…
                </Body>
              </div>
            ) : (
              <Form className={styles.form} onSubmit={handleCreatePop}>
                <div className={styles.fieldBlock}>
                  <TextField
                    label='Nombre del punto de venta'
                    name='popName'
                    placeholder='Ej: Mi Tienda, Restaurante El Buen Sabor'
                    errorMessage={
                      fieldErrors.popName ||
                      'Ingresa un nombre para tu punto de venta'
                    }
                    isInvalid={!!fieldErrors.popName}
                    required
                    autoFocus
                    onInput={(e) => {
                      const value = e.target.value
                      setPopName(value)
                      if (!isSubmittingRef.current) {
                        validateField('popName', value)
                      }
                    }}
                  />
                </div>

                {loadingTypes ? (
                  <div
                    className={styles.subscriptionBlock}
                    aria-busy='true'
                    aria-label='Cargando tipos de negocio'
                  >
                    <div
                      className={`${styles.serviceTypePickerShell} ${styles.serviceTypePickerStatic}`}
                    >
                      <div className={styles.serviceTypeLabel}>
                        Tipo de negocio (opcional)
                      </div>
                      <div className={styles.skeletonCards}>
                        {Array.from({ length: BUSINESS_TYPES_SKELETON_COUNT }, (_, key) => (
                          <div key={key} className={styles.skeletonCard}>
                            <div className={styles.skeletonRadioDot} />
                            <div className={styles.skeletonCardInner}>
                              <div className={styles.skeletonCardTitle} />
                              <div className={styles.skeletonCardLine} />
                              <div className={styles.skeletonCardLineShort} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className={styles.serviceTypeDescription}>
                        El tipo de negocio determina las funcionalidades disponibles.
                        Podés cambiarlo más adelante.
                      </p>
                    </div>
                  </div>
                ) : businessTypes.length > 0 ? (
                  <div className={styles.subscriptionBlock}>
                    <RadioGroup
                      className={`${styles.businessRadioGroup} ${styles.serviceTypePickerShell}`}
                      label='Tipo de negocio (opcional)'
                      value={selectedBusinessType}
                      onChange={(value) => setSelectedBusinessType(value)}
                      description='El tipo de negocio determina las funcionalidades disponibles. Podés cambiarlo más adelante.'
                    >
                      {businessTypes.map((type) => (
                        <Radio key={type.id} value={type.id}>
                          <div className={styles.radioCard}>
                            <div className={styles.radioCardTitle}>
                              {type.display_name}
                            </div>
                            {type.addon_price_monthly > 0 && (
                              <div className={styles.radioCardPrice}>
                                +${type.addon_price_monthly}/mes
                              </div>
                            )}
                            {type.description && (
                              <div className={styles.radioCardDesc}>
                                {type.description}
                              </div>
                            )}
                          </div>
                        </Radio>
                      ))}
                    </RadioGroup>
                  </div>
                ) : null}

                {error && (
                  <div className={styles.errorBanner} role='alert'>
                    {error}
                  </div>
                )}

                <ButtonRs
                  type='submit'
                  isPending={loading}
                  className={styles.submitButton}
                >
                  Crear punto de venta
                </ButtonRs>
              </Form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default CreatePopPage
