'use client'

import { useState } from 'react'

import Image from 'next/image'
import { Body, ButtonRs } from 'rootsy-feparts'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const LoginWithGoogleForm = ({ router }) => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleLogin = async () => {
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
      setError(error.message || 'Error al iniciar sesión con Google')
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
          <Image
            src='https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg'
            aria-hidden
            alt=''
            width={24}
            height={24}
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

export default LoginWithGoogleForm