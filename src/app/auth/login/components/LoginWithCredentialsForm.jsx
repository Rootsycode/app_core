'use client'

import { useState, useRef } from 'react'

import { Body, ButtonRs, Form, TextField } from 'rootsy-feparts'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import styles from '../page.module.css'

const LoginWithCredentialsForm = ({ router }) => {
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)
  const supabase = createClientComponentClient()

  const validateField = (fieldName, value) => {
    let error = ''
    
    if (fieldName === 'email') {
      if (!value || value.trim() === '') {
        error = 'El correo electrónico es requerido'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = 'Por favor ingresa un correo electrónico válido'
      }
    } else if (fieldName === 'password') {
      if (!value || value === '') {
        error = 'La contraseña es requerida'
      }
    }
    
    setFieldErrors(prev => {
      if (prev[fieldName] && !error) {
        return { ...prev, [fieldName]: '' }
      }
      if (error) {
        return { ...prev, [fieldName]: error }
      }
      return prev
    })
  }

  const validateForm = (email, password) => {
    const errors = {
      email: '',
      password: ''
    }
    let isValid = true

    if (!email || email.trim() === '') {
      errors.email = 'El correo electrónico es requerido'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Por favor ingresa un correo electrónico válido'
      isValid = false
    }

    if (!password || password === '') {
      errors.password = 'La contraseña es requerida'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleLogin = async e => {
    e.preventDefault()
    setError('')
    
    isSubmittingRef.current = true
    
    const email = e.target.email?.value?.trim() || ''
    const password = e.target.password?.value || ''

    const isValid = validateForm(email, password)
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
    
    isSubmittingRef.current = false
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        throw error
      }
      if (data) {
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/home')
        router.refresh()
      }
      setIsLoading(false)
    } catch (error) {
      const errorMsg = error.message?.toLowerCase() || ''
      if (errorMsg.includes('invalid login credentials') || 
          errorMsg.includes('invalid credentials') ||
          errorMsg.includes('email not confirmed')) {
        setError('Correo electrónico o contraseña incorrectos')
      } else {
        setError(error.message || 'Error al iniciar sesión')
      }
      setIsLoading(false)
    }
  }

  return (
    <Form className={styles.form} onSubmit={handleLogin}>
      <TextField
        label='Correo electrónico'
        name='email'
        type='email'
        placeholder='usuario@mail.com'
        errorMessage={fieldErrors.email || 'Por favor ingresa un correo electrónico válido'}
        isInvalid={!!fieldErrors.email}
        pattern='^[^\s@]+@[^\s@]+\.[^\s@]+$'
        style={{ marginBottom: '12px' }}
        required
        onInput={(e) => validateField('email', e.target.value)}
      />
      <TextField
        label='Contraseña'
        name='password'
        type='password'
        errorMessage={fieldErrors.password || 'La contraseña es requerida'}
        isInvalid={!!fieldErrors.password}
        style={{ marginBottom: '16px' }}
        required
        onInput={(e) => validateField('password', e.target.value)}
      />

      {error && (
        <Body size='sm' style={{ marginBottom: '16px', color: 'var(--invalid-color, #ef4444)' }}>
          {error}
        </Body>
      )}

      <ButtonRs type='submit' isPending={isLoading}>
        Ingresar
      </ButtonRs>
    </Form>
  )
}

export default LoginWithCredentialsForm
