'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Body, ButtonRs, Form, TextField, Title, Link, RadioGroup, Radio } from 'rootsy-feparts'
import { createPop } from '@/lib/popHelpers'
import { LoginLayout } from '@/components/layouts/LoginLayout'
import styles from './page.module.css'

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
      } catch (err) {
        console.error('Error loading business types:', err)
      } finally {
        setLoadingTypes(false)
      }
    }
    loadBusinessTypes()
  }, [])

  // Validar un campo individual en tiempo real
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
    } else if (fieldName === 'businessType') {
      // El tipo de negocio es opcional, no necesita validación
    }

    // Solo actualizar el error si el campo tiene un error o si estaba en error y ahora es válido
    setFieldErrors((prev) => {
      // Si el campo tenía un error y ahora es válido, limpiarlo
      if (prev[fieldName] && !error) {
        return { ...prev, [fieldName]: '' }
      }
      // Si el campo tiene un error, actualizarlo
      if (error) {
        return { ...prev, [fieldName]: error }
      }
      // Si no hay error y no había error antes, no hacer nada
      return prev
    })
  }

  const validateForm = (name, businessType) => {
    const errors = {
      popName: '',
      businessType: ''
    }
    let isValid = true

    // Validar nombre
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

    // Validar formulario antes de enviar
    const isValid = validateForm(name, businessType)
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
        // Redirigir al profile después de 2 segundos
        setTimeout(() => {
          router.push('/profile')
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
    <LoginLayout>
      <Title size='xs'>Crear nuevo punto de venta</Title>
      <Body size='sm' style={{ marginTop: '8px', marginBottom: '24px' }}>
        Crea tu primer punto de venta y comienza a gestionar tu negocio. Tendrás 7 días de prueba gratis.
      </Body>

      {success ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Body size='sm' style={{ color: 'var(--success-500, #1EAE89)', marginBottom: '16px' }}>
            ✅ ¡Punto de venta creado exitosamente!
          </Body>
          <Body size='sm'>Redirigiendo a tu perfil...</Body>
        </div>
      ) : (
        <Form className={styles.form} onSubmit={handleCreatePop}>
          <TextField
            label='Nombre del punto de venta'
            name='popName'
            placeholder='Ej: Mi Tienda, Restaurante El Buen Sabor'
            errorMessage={fieldErrors.popName || 'Ingresa un nombre para tu punto de venta'}
            isInvalid={!!fieldErrors.popName}
            required
            style={{ marginBottom: '24px' }}
            autoFocus
            onInput={(e) => {
              const value = e.target.value
              setPopName(value)
              if (!isSubmittingRef.current) {
                validateField('popName', value)
              }
            }}
          />

          {loadingTypes ? (
            <div style={{ marginBottom: '24px' }}>
              <Body size='sm' style={{ color: '#666' }}>Cargando tipos de negocio...</Body>
            </div>
          ) : businessTypes.length > 0 ? (
            <div style={{ marginBottom: '24px' }}>
              <RadioGroup
                label='Tipo de negocio (opcional)'
                value={selectedBusinessType}
                onChange={(value) => setSelectedBusinessType(value)}
                description='El tipo de negocio determina las funcionalidades disponibles. Puedes cambiarlo más tarde.'
              >
                {businessTypes.map((type) => (
                  <Radio key={type.id} value={type.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '500' }}>{type.display_name}</span>
                      {type.addon_price_monthly > 0 && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          +${type.addon_price_monthly}/mes
                        </span>
                      )}
                      {type.description && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {type.description}
                        </span>
                      )}
                    </div>
                  </Radio>
                ))}
              </RadioGroup>
            </div>
          ) : null}

          {error && (
            <Body
              size='sm'
              style={{
                marginBottom: '16px',
                color: 'var(--invalid-color, #ef4444)',
                padding: '12px',
                background: '#fee',
                borderRadius: '4px'
              }}
            >
              {error}
            </Body>
          )}

          <ButtonRs type='submit' isPending={loading} style={{ width: '100%' }}>
            Crear punto de venta
          </ButtonRs>
        </Form>
      )}

      <Body size='sm' style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link onPress={() => router.push('/profile')}>Volver al perfil</Link>
      </Body>
    </LoginLayout>
  )
}

export default CreatePopPage

