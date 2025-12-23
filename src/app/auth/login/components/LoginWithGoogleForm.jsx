'use client'

import { useState } from 'react'

import Image from 'next/image'
import { Body, ButtonRs } from 'rootsy-feparts'

import { supabase } from '@/lib/supabase'

const LoginWithGoogleForm = ({ router }) => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      })
      if (error) {
        throw error
      }
      if (data) {
        router.push('/profile')
      }
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