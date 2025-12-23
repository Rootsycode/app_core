/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { Body, ButtonRs, Form, Link, TextField, Title } from 'rootsy-feparts'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { withGuestAuth } from '@/hoc/withGuestAuth'
import { LoginLayout } from '@/components/layouts/LoginLayout'
import styles from './page.module.css'

const ResetPasswordForm = ({ router }) => {
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)
  const supabase = createClientComponentClient()

  // Validar un campo individual en tiempo real
  const validateField = (fieldName, value) => {
    let error = ''
    
    if (fieldName === 'email') {
      if (!value || value.trim() === '') {
        error = 'El correo electrónico es requerido'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = 'Por favor ingresa un correo electrónico válido'
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

  const validateForm = (email) => {
    const errors = {
      email: ''
    }
    let isValid = true

    if (!email || email.trim() === '') {
      errors.email = 'El correo electrónico es requerido'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Por favor ingresa un correo electrónico válido'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    isSubmittingRef.current = true
    setError('')
    setIsSuccess(false)
    
    const email = e.target.email?.value?.trim() || ''
    
    // Validar formulario antes de enviar
    const isValid = validateForm(email)
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
    setFieldErrors({ email: '' })

    try {
      // Asegurarse de que el email esté en minúsculas y sin espacios
      const cleanEmail = email.trim().toLowerCase()
      
      // Obtener la URL base para el redirect
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/auth/update-password`
      })

      if (resetError) {
        throw resetError
      }

      // Éxito: mostrar mensaje de confirmación
      setIsSuccess(true)
      setIsLoading(false)
    } catch (error) {
      setError(error.message || 'Error al enviar el correo de recuperación')
      setIsLoading(false)
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <Form className={styles.form} onSubmit={handleResetPassword}>
      <TextField
        label='Correo electrónico'
        name='email'
        placeholder='usuario@mail.com'
        errorMessage={fieldErrors.email || 'Ingresa un correo correcto válido'}
        isInvalid={!!fieldErrors.email}
        pattern='^[^\s@]+@[^\s@]+\.[^\s@]+$'
        style={{ marginBottom: '16px' }}
        required
        onInput={(e) => validateField('email', e.target.value)}
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
          Te enviamos un correo electrónico con las instrucciones para recuperar tu contraseña. Por favor, revisa tu bandeja de entrada.
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

      <ButtonRs type='submit' isPending={isLoading}>
        Enviar instrucciones
      </ButtonRs>
    </Form>
  )
}

const Page = () => {
  const router = useRouter()

  return (
    <LoginLayout>
      <Title size='xs'>Recuperar contraseña</Title>
      <Body size='sm'>
        Ingresá tu correo electrónico y te enviaremos las instrucciones para recuperar tu contraseña.
      </Body>

      <ResetPasswordForm router={router} />

      <Body size='sm' style={{ textAlign: 'center', marginTop: '12px' }}>
        <Link onPress={() => router.push('/auth/login')}>Volver a iniciar sesión</Link>
      </Body>
    </LoginLayout>
  )
}

export default withGuestAuth(Page)
