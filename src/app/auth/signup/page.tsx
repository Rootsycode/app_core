/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { Body, ButtonRs, Form, Link, TextField, Title } from 'rootsy-feparts'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { withGuestAuth } from '@/hoc/withGuestAuth'
import { LoginLayout } from '@/components/layouts/LoginLayout'
import styles from './page.module.css'

const RegisterWithEmail = ({ router }) => {
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    surname: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)
  const supabase = createClientComponentClient()

  const validateField = (fieldName, value) => {
    let error = ''
    
    if (fieldName === 'name') {
      if (!value || value.trim() === '') {
        error = 'El nombre es requerido'
      } else if (!/^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$/.test(value.trim())) {
        error = 'El nombre solo puede contener letras y espacios'
      }
    } else if (fieldName === 'surname') {
      if (!value || value.trim() === '') {
        error = 'El apellido es requerido'
      } else if (!/^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$/.test(value.trim())) {
        error = 'El apellido solo puede contener letras y espacios'
      }
    } else if (fieldName === 'email') {
      if (!value || value.trim() === '') {
        error = 'El correo electrónico es requerido'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = 'Por favor ingresa un correo electrónico válido'
      }
    } else if (fieldName === 'password') {
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

  const validateForm = (name, surname, email, password) => {
    const errors = {
      name: '',
      surname: '',
      email: '',
      password: ''
    }
    let isValid = true

    if (!name || name.trim() === '') {
      errors.name = 'El nombre es requerido'
      isValid = false
    } else if (!/^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$/.test(name.trim())) {
      errors.name = 'El nombre solo puede contener letras y espacios'
      isValid = false
    }

    if (!surname || surname.trim() === '') {
      errors.surname = 'El apellido es requerido'
      isValid = false
    } else if (!/^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$/.test(surname.trim())) {
      errors.surname = 'El apellido solo puede contener letras y espacios'
      isValid = false
    }

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

    setFieldErrors(errors)
    return isValid
  }

  const handleRegister = async e => {
    e.preventDefault()
    setError('')
    setIsSuccess(false)
    
    isSubmittingRef.current = true
    
    const email = e.target.email?.value?.trim() || ''
    const password = e.target.password?.value || ''
    const firstName = e.target.name?.value?.trim() || ''
    const lastName = e.target.surname?.value?.trim() || ''

    const isValid = validateForm(firstName, lastName, email, password)
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
    setFieldErrors({ name: '', surname: '', email: '', password: '' })

    try {
      const cleanEmail = email.trim().toLowerCase()
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      })

      if (authError) {
        if (authData?.user) {
        } else {
          const errorMsg = authError.message?.toLowerCase() || ''
          if (errorMsg.includes('already registered') || 
              errorMsg.includes('user already registered') ||
              errorMsg.includes('already exists') ||
              errorMsg.includes('email address is already registered')) {
            setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          } else if (errorMsg.includes('invalid') && errorMsg.includes('email')) {
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
              setError('Hubo un problema al registrar el correo electrónico. Por favor, intenta nuevamente.')
            } else {
              setError('Por favor ingresa un correo electrónico válido')
            }
          } else {
            setError(authError.message || 'Error al registrar usuario')
          }
          setIsLoading(false)
          return
        }
      }

      if (!authData?.user) {
        setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
        setIsLoading(false)
        return
      }

      if (!authData.session) {
        if (authData.user.email_confirmed_at) {
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }

        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (existingUser && !checkError) {
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }

        const userCreatedAt = new Date(authData.user.created_at)
        const now = new Date()
        const timeDiff = (now - userCreatedAt) / 1000

        if (timeDiff > 10) {
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }

        
        if (timeDiff > 2) {
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }

        setError('Por favor, revisa tu correo electrónico para confirmar tu cuenta.')
        setIsSuccess(true)
        setIsLoading(false)
        return
      }

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName
        })

      if (profileError) {
        if (profileError.code === '23505') {
        } else {
          setError('Usuario creado pero hubo un error al crear el perfil. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/home')
      router.refresh()
      setIsLoading(false)
    } catch (error) {
      const errorMessage = error?.message || 'Error al registrar usuario'
      if (errorMessage.includes('already registered') || 
          errorMessage.includes('already exists')) {
        setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
      } else {
        setError(errorMessage)
      }
      setIsLoading(false)
    }
  }

  return (
    <Form className={styles.form} onSubmit={handleRegister}>
      <div className={styles.dos_inputs}>
        <TextField
          label='Nombre'
          name='name'
          errorMessage={fieldErrors.name || 'Ingresá un nombre válido'}
          isInvalid={!!fieldErrors.name}
          pattern='^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$'
          style={{ maxWidth: '100%', minWidth: 0 }}
          required
          onInput={(e) => validateField('name', e.target.value)}
        />
        <TextField
          label='Apellido'
          name='surname'
          style={{ maxWidth: '100%', minWidth: 0 }}
          errorMessage={fieldErrors.surname || 'Ingresá un apellido válido'}
          isInvalid={!!fieldErrors.surname}
          pattern='^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$'
          required
          onInput={(e) => validateField('surname', e.target.value)}
        />
      </div>

      <TextField
        label='Correo electrónico'
        placeholder='Ej. noelgallagher@gmail.com'
        name='email'
        type='email'
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
        errorMessage={fieldErrors.password || 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)'}
        isInvalid={!!fieldErrors.password}
        pattern='^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
        style={{ marginBottom: '16px' }}
        required
        onInput={(e) => validateField('password', e.target.value)}
      />

      {error && (
        <Body 
          size='sm' 
          style={{ 
            marginBottom: '16px', 
            color: isSuccess 
              ? 'var(--success-500, #1EAE89)' 
              : 'var(--invalid-color, #ef4444)' 
          }}
        >
          {error}
        </Body>
      )}

      <ButtonRs type='submit' isPending={isLoading}>
        Registrarse
      </ButtonRs>
    </Form>
  )
}

const RegisterWithGoogle = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleRegister = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/home`
        }
      })
      
      if (authError) {
        throw authError
      }
      
    } catch (error) {
      setError(error.message || 'Error al registrar con Google')
      setIsLoading(false)
    }
  }

  return (
    <>
      <ButtonRs
        onPress={handleRegister}
        hierarchy='secondary'
        isPending={isLoading}
        leftIcon={
          <Image
            src='https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg'
            aria-hidden
            alt=''
            width={24}
            height={24}
          />
        }
      >
        Registrate con Google
      </ButtonRs>
      {error && (
        <Body size='sm' style={{ marginTop: '16px' }}>
          {error}
        </Body>
      )}
    </>
  )
}

const Page = () => {
  const router = useRouter()

  return (
    <LoginLayout>
      <Title size='xs'>Registrarse</Title>
      <Body size='sm'>
        Ya tengo cuenta. Quiero{' '}
        <Link onPress={() => router.push('/auth/login')}>iniciar sesión</Link>.
      </Body>

      <RegisterWithEmail router={router} />

      <Body size='sm' style={{ textAlign: 'center', marginTop: '12px' }}>
        <Link onPress={() => router.push('/auth/reset-password')}>No recuerdo mi contraseña</Link>
      </Body>

      <div className={styles.divider} aria-hidden />

      <RegisterWithGoogle />
    </LoginLayout>
  )
}

export default withGuestAuth(Page)
