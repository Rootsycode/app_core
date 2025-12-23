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
  const [isSuccess, setIsSuccess] = useState(false) // Para distinguir mensajes de éxito
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    surname: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)
  const supabase = createClientComponentClient()

  // Validar un campo individual en tiempo real
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

  const validateForm = (name, surname, email, password) => {
    const errors = {
      name: '',
      surname: '',
      email: '',
      password: ''
    }
    let isValid = true

    // Validar nombre
    if (!name || name.trim() === '') {
      errors.name = 'El nombre es requerido'
      isValid = false
    } else if (!/^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$/.test(name.trim())) {
      errors.name = 'El nombre solo puede contener letras y espacios'
      isValid = false
    }

    // Validar apellido
    if (!surname || surname.trim() === '') {
      errors.surname = 'El apellido es requerido'
      isValid = false
    } else if (!/^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$/.test(surname.trim())) {
      errors.surname = 'El apellido solo puede contener letras y espacios'
      isValid = false
    }

    // Validar email
    if (!email || email.trim() === '') {
      errors.email = 'El correo electrónico es requerido'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Por favor ingresa un correo electrónico válido'
      isValid = false
    }

    // Validar contraseña
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
    setIsSuccess(false) // Limpiar estado de éxito
    
    // Marcar que estamos en proceso de validación
    isSubmittingRef.current = true
    
    const email = e.target.email?.value?.trim() || ''
    const password = e.target.password?.value || ''
    const firstName = e.target.name?.value?.trim() || ''
    const lastName = e.target.surname?.value?.trim() || ''

    // Validar formulario antes de enviar
    // validateForm establece los errores en el estado
    const isValid = validateForm(firstName, lastName, email, password)
    if (!isValid) {
      // Los errores ya se establecieron en validateForm
      // Esperar un momento para que React actualice el estado
      setTimeout(() => {
        isSubmittingRef.current = false
        // Usar los errores recién establecidos
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
    
    // Si la validación pasa, permitir que onInput valide campos
    isSubmittingRef.current = false

    // Si la validación pasa, limpiar errores y proceder
    setIsLoading(true)
    setFieldErrors({ name: '', surname: '', email: '', password: '' })

    try {
      // Asegurarse de que el email esté en minúsculas y sin espacios
      const cleanEmail = email.trim().toLowerCase()
      
      // Intentar registrar usuario en Supabase Auth
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

      // Verificar si hay error PERO también verificar si el usuario se creó
      // A veces Supabase devuelve un error pero el usuario se registra correctamente
      if (authError) {
        // Si el usuario se creó a pesar del error, ignorar el error y continuar
        if (authData?.user) {
          console.log('Usuario creado exitosamente a pesar del error de Supabase:', authError.message)
          // Continuar con el flujo normal, no retornar aquí
        } else {
          // Solo mostrar error si NO se creó el usuario
          const errorMsg = authError.message?.toLowerCase() || ''
          if (errorMsg.includes('already registered') || 
              errorMsg.includes('user already registered') ||
              errorMsg.includes('already exists') ||
              errorMsg.includes('email address is already registered')) {
            setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          } else if (errorMsg.includes('invalid') && errorMsg.includes('email')) {
            // Si Supabase dice que el email es inválido, verificar si es un problema de formato
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
              // El email tiene formato válido según nuestra validación
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

      // Verificar que se haya creado el usuario
      if (!authData?.user) {
        setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
        setIsLoading(false)
        return
      }

      // Si NO hay sesión, significa que el usuario ya existe o necesita confirmar email
      if (!authData.session) {
        // PRIMERO: Verificar si el usuario tiene email_confirmed_at (ya está confirmado y existe)
        // Esta es la señal más confiable de que el usuario ya existe
        if (authData.user.email_confirmed_at) {
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }

        // SEGUNDO: Verificar si el usuario ya existe en la tabla users
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle()

        // Si el usuario ya existe en la tabla users, definitivamente ya estaba registrado
        if (existingUser && !checkError) {
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }

        // TERCERO: Verificar la fecha de creación
        // Si el usuario fue creado hace más de 10 segundos, probablemente ya existía
        // (un usuario nuevo se crea instantáneamente, así que si pasó mucho tiempo, es porque ya existía)
        const userCreatedAt = new Date(authData.user.created_at)
        const now = new Date()
        const timeDiff = (now - userCreatedAt) / 1000 // en segundos

        // Si el usuario fue creado hace más de 10 segundos, probablemente ya existía
        // Esto es un margen de seguridad para evitar falsos positivos
        if (timeDiff > 10) {
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }

        // Si llegamos aquí y el usuario fue creado hace menos de 10 segundos,
        // es probablemente un usuario nuevo que necesita confirmar email
        // PERO: si Supabase no requiere confirmación de email, esto no debería pasar
        // En ese caso, debería haber una sesión
        
        // Verificar si Supabase requiere confirmación de email
        // Si no requiere confirmación y no hay sesión, el usuario probablemente ya existe
        // Por seguridad, asumir que es un usuario nuevo solo si fue creado hace menos de 2 segundos
        if (timeDiff > 2) {
          // Usuario creado hace más de 2 segundos sin sesión ni confirmación
          // Probablemente ya existía
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }

        // Si llegamos aquí, es un usuario nuevo que necesita confirmar email
        // Solo mostrar este mensaje si realmente es un usuario nuevo (creado hace menos de 2 segundos)
        setError('Por favor, revisa tu correo electrónico para confirmar tu cuenta.')
        setIsSuccess(true) // Marcar como mensaje de éxito
        setIsLoading(false)
        return
      }

      // Crear perfil del usuario en la tabla users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName
        })

      if (profileError) {
        // Si el perfil ya existe, no es un error crítico
        if (profileError.code === '23505') { // Violación de constraint único
          console.warn('El perfil del usuario ya existe')
        } else {
          console.error('Error creating user profile:', profileError)
          setError('Usuario creado pero hubo un error al crear el perfil. Por favor, inicia sesión.')
          setIsLoading(false)
          return
        }
      }

      // Esperar un momento para que las cookies se establezcan
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/profile')
      router.refresh()
      setIsLoading(false)
    } catch (error) {
      // Manejar errores inesperados
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

      {/* Mostrar errores del servidor (email duplicado, errores de red, etc.) o mensajes de éxito */}
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

// Componente de registro con Google
const RegisterWithGoogle = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleRegister = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Obtener la URL base (funciona tanto en desarrollo como en producción)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/profile`
        }
      })
      
      if (authError) {
        throw authError
      }
      
      // signInWithOAuth redirige automáticamente, no necesitamos hacer nada más aquí
      // El callback route manejará la redirección a /profile
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
