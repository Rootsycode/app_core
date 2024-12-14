/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import {
  Body,
  ButtonRs,
  Form,
  Link,
  ProgressCircle,
  TextField,
  Title
} from 'rootsy-feparts'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth'
import { withGuestAuth } from '@/hoc/withGuestAuth'
import { LoginLayout } from '@/components/layouts/LoginLayout'
import { auth } from '@/lib/firebase.config'
import styles from './page.module.css'

const LoginWithEmail = () => {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async e => {
    e.preventDefault()
    setIsLoading(true)
    const email = e.target.email.value
    const password = e.target.password.value
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Redirige al usuario a la página de inicio o a la página de perfil
      setIsLoading(false)
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <Form className={styles.form} onSubmit={handleLogin}>
      <TextField
        label='Correo electrónico'
        name='email'
        placeholder='usuario@mail.com'
        errorMessage='Ingresa un correo correcto válido'
        pattern='^[^\s@]+@[^\s@]+\.[^\s@]+$'
        style={{ marginBottom: '12px' }}
      />
      <TextField
        label='Contraseña'
        name='password'
        type='password'
        pattern='^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
        errorMessage='Ingresa una contraseña válida'
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
      setIsLoading(false)
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <>
      <ButtonRs
        onPress={handleLogin}
        isPending={isLoading}
        hierarchy='secondary'
        leftIcon={
          <img
            src='https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg'
            aria-hidden
          />
        }
      >
        Iniciar sesión con Google
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
      <Title size='xs'>Iniciar sesión</Title>
      <Body size='sm'>
        ¿No tenés cuenta?{' '}
        <Link onPress={() => router.push('register')}>Registrarte</Link> es muy
        fácil.
      </Body>

      {LoginWithEmail()}

      <Body size='sm' style={{ textAlign: 'center', marginTop: '12px' }}>
        <Link>No recuerdo mi contraseña</Link>
      </Body>

      <div className={styles.divider} aria-hidden />

      {LoginWithGoogle()}
    </LoginLayout>
  )
}

export default withGuestAuth(Page)
