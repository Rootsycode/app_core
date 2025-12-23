'use client'

import { useState } from 'react'

import { Body, ButtonRs, Form, TextField } from 'rootsy-feparts'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import styles from '../page.module.css'

const LoginWithCredentialsForm = ({ router }) => {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleLogin = async e => {
    e.preventDefault()
    setIsLoading(true)
    const email = e.target.email.value
    const password = e.target.password.value
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        throw error
      }
      if (data) {
        // Esperar un momento para que las cookies se establezcan
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/profile')
        router.refresh() // Forzar refresh para que el contexto actualice
      }
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

export default LoginWithCredentialsForm
