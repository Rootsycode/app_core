/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { Body, ButtonRs, Form, Link, TextField, Title } from 'rootsy-feparts'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LoginLayout } from '@/components/layouts/LoginLayout'
import styles from './page.module.css'

const UpdatePasswordForm = ({ router, searchParams }) => {
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingToken, setIsVerifyingToken] = useState(true)
  const isSubmittingRef = useRef(false)
  const supabase = createClientComponentClient()

  // Verificar el token_hash cuando el componente se monta
  useEffect(() => {
    const verifyToken = async () => {
      const token_hash = searchParams?.get('token_hash')
      const type = searchParams?.get('type')

      // Si hay token_hash en la URL, verificar el token para establecer la sesión (PKCE flow)
      if (token_hash && type) {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: type,
            token_hash: token_hash
          })

          if (verifyError) {
            setError('El link de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.')
            setIsVerifyingToken(false)
            return
          }
          // Si no hay error, la sesión se estableció correctamente
        } catch (err) {
          setError('Error al verificar el link de recuperación. Por favor, solicita uno nuevo.')
          setIsVerifyingToken(false)
          return
        }
      } else {
        // Si no hay token_hash, verificar si hay una sesión activa (implicit flow)
        // Esperar un momento para que las cookies se establezcan si vienen del email
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!session) {
          setError('No hay una sesión activa. Por favor, solicita un nuevo link de recuperación desde la página de recuperación de contraseña.')
        }
      }

      setIsVerifyingToken(false)
    }

    verifyToken()
  }, [searchParams, supabase])

  // Validar un campo individual en tiempo real
  const validateField = (fieldName, value, confirmValue = '') => {
    let error = ''
    
    if (fieldName === 'password') {
      if (!value || value === '') {
        error = 'La contraseña es requerida'
      } else if (value.length < 8) {
        error = 'La contraseña debe tener al menos 8 caracteres'
      } else if (!/(?=.*[A-Z])/.test(value)) {
        error = 'La contraseña debe contener al menos una mayúscula'
      } else if (!/(?=.*\d)/.test(value)) {
        error = 'La contraseña debe contener al menos un número'
      } else if (!/(?=.*[@$!%*?&])/.test(value)) {
        error = 'La contraseña debe contener al menos un carácter especial (@$!%*?&)'
      }
    } else if (fieldName === 'confirmPassword') {
      if (!value || value === '') {
        error = 'Por favor confirma tu contraseña'
      } else if (value !== confirmValue) {
        error = 'Las contraseñas no coinciden'
      }
    }
    
    // Solo actualizar el error si el campo tiene un error o si estaba en error y ahora es válido
    setFieldErrors(prev => {
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

  const validateForm = (password, confirmPassword) => {
    const errors = {
      password: '',
      confirmPassword: ''
    }
    let isValid = true

    if (!password || password === '') {
      errors.password = 'La contraseña es requerida'
      isValid = false
    } else if (password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres'
      isValid = false
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = 'La contraseña debe contener al menos una mayúscula'
      isValid = false
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = 'La contraseña debe contener al menos un número'
      isValid = false
    } else if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.password = 'La contraseña debe contener al menos un carácter especial (@$!%*?&)'
      isValid = false
    }

    if (!confirmPassword || confirmPassword === '') {
      errors.confirmPassword = 'Por favor confirma tu contraseña'
      isValid = false
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Las contraseñas no coinciden'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    isSubmittingRef.current = true
    setError('')
    setIsSuccess(false)
    
    const password = e.target.password?.value || ''
    const confirmPassword = e.target.confirmPassword?.value || ''
    
    // Validar formulario antes de enviar
    const isValid = validateForm(password, confirmPassword)
    if (!isValid) {
      setTimeout(() => {
        isSubmittingRef.current = false
        setFieldErrors(currentErrors => {
          const firstErrorField = Object.keys(currentErrors).find(key => currentErrors[key])
          if (firstErrorField) {
            setTimeout(() => {
              const fieldElement = document.querySelector(`[name="${firstErrorField}"]`)
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

    setIsLoading(true)
    setFieldErrors({ password: '', confirmPassword: '' })

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      // Éxito: mostrar mensaje y redirigir después de un momento
      setIsSuccess(true)
      setIsLoading(false)
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (error) {
      setError(error.message || 'Error al actualizar la contraseña')
      setIsLoading(false)
    } finally {
      isSubmittingRef.current = false
    }
  }

  // Mostrar loading mientras se verifica el token
  if (isVerifyingToken) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Body size='sm'>Verificando link de recuperación...</Body>
      </div>
    )
  }

  return (
    <Form className={styles.form} onSubmit={handleUpdatePassword}>
      <TextField
        label='Nueva contraseña'
        name='password'
        type='password'
        errorMessage={fieldErrors.password || 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)'}
        isInvalid={!!fieldErrors.password}
        pattern='^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
        style={{ marginBottom: '12px' }}
        required
        onInput={(e) => {
          const password = e.target.value
          const confirmPassword = document.querySelector('[name="confirmPassword"]')?.value || ''
          validateField('password', password)
          // Si hay confirmPassword, validarlo también
          if (confirmPassword) {
            validateField('confirmPassword', confirmPassword, password)
          }
        }}
      />
      <TextField
        label='Confirmar contraseña'
        name='confirmPassword'
        type='password'
        errorMessage={fieldErrors.confirmPassword || 'Las contraseñas deben coincidir'}
        isInvalid={!!fieldErrors.confirmPassword}
        style={{ marginBottom: '16px' }}
        required
        onInput={(e) => {
          const confirmPassword = e.target.value
          const password = document.querySelector('[name="password"]')?.value || ''
          validateField('confirmPassword', confirmPassword, password)
        }}
      />

      {/* Mostrar mensaje de éxito o error */}
      {isSuccess && (
        <Body 
          size='sm' 
          style={{ 
            marginBottom: '16px', 
            color: 'var(--success-500, #1EAE89)' 
          }}
        >
          ¡Contraseña actualizada exitosamente! Redirigiendo al login...
        </Body>
      )}

      {error && !isSuccess && (
        <Body 
          size='sm' 
          style={{ 
            marginBottom: '16px', 
            color: 'var(--invalid-color, #ef4444)' 
          }}
        >
          {error}
        </Body>
      )}

      <ButtonRs type='submit' isPending={isLoading} isDisabled={!!error && !isSuccess}>
        Actualizar contraseña
      </ButtonRs>
    </Form>
  )
}

const Page = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <LoginLayout>
      <Title size='xs'>Actualizar contraseña</Title>
      <Body size='sm'>
        Ingresá tu nueva contraseña. Asegurate de que tenga al menos 8 caracteres, una mayúscula, un número y un carácter especial.
      </Body>

      <UpdatePasswordForm router={router} searchParams={searchParams} />

      <Body size='sm' style={{ textAlign: 'center', marginTop: '12px' }}>
        <Link onPress={() => router.push('/auth/login')}>Volver a iniciar sesión</Link>
      </Body>
    </LoginLayout>
  )
}

export default Page

