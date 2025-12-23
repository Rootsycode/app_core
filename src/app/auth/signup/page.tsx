/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { Body, ButtonRs, Form, Link, TextField, Title } from 'rootsy-feparts'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { withGuestAuth } from '@/hoc/withGuestAuth'
import { LoginLayout } from '@/components/layouts/LoginLayout'
import { auth } from '@/lib/firebase.config'
import styles from './page.module.css'

const RegisterWithEmail = () => {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async e => {
    e.preventDefault()
    setIsLoading(true)
    const email = e.target.email.value
    const password = e.target.password.value
    const name = e.target.name.value
    const surname = e.target.surname.value
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      setIsLoading(false)
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <Form className={styles.form} onSubmit={handleRegister}>
      <div className={styles.dos_inputs}>
        <TextField
          label='Nombre'
          name='name'
          errorMessage='Ingresá un nombre válido'
          pattern='^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$'
          style={{ maxWidth: '100%', minWidth: 0 }}
        />
        <TextField
          label='Apellido'
          name='surname'
          style={{ maxWidth: '100%', minWidth: 0 }}
          errorMessage='Ingresá un apellido válido'
          pattern='^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$'
        />
      </div>

      <TextField
        label='Correo electrónico'
        placeholder='Ej. noelgallagher@gmail.com'
        name='email'
        errorMessage='Por favor ingresa un correo correcto'
        pattern='^[^\s@]+@[^\s@]+\.[^\s@]+$'
        style={{ marginBottom: '12px' }}
      />
      <TextField
        label='Contraseña'
        name='password'
        type='password'
        pattern='^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
        errorMessage='La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial.'
        style={{ marginBottom: '16px' }}
      />

      {error && (
        <Body size='sm' style={{ marginBottom: '16px' }}>
          {error}
        </Body>
      )}

      <ButtonRs type='submit' isPending={isLoading}>
        Ingresar
      </ButtonRs>
    </Form>
  )
}

const LoginWithGoogle = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      // Redirige al usuario a la página de inicio o a la página de perfil
      setIsLoading(false)
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <>
      <ButtonRs
        onClick={handleLogin}
        hierarchy='secondary'
        isPending={isLoading}
        leftIcon={
          <img
            src='https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg'
            aria-hidden
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
        <Link onPress={() => router.push('login')}>iniciar sesión</Link>.
      </Body>

      {RegisterWithEmail()}

      <Body size='sm' style={{ textAlign: 'center', marginTop: '12px' }}>
        <Link>No recuerdo mi contraseña</Link>
      </Body>

      <div className={styles.divider} aria-hidden />

      {LoginWithGoogle()}
    </LoginLayout>
  )
}

export default withGuestAuth(Page)
