'use client'

import { useEffect } from 'react'
import { Body, ButtonRs, Title } from 'rootsy-feparts'
import styles from './page.module.css'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Profile page error:', error)
  }, [error])

  return (
    <div className={styles.container}>
      <main className={styles.main} style={{ textAlign: 'center' }}>
        <Title>Algo salió mal</Title>
        <Body size='lg' style={{ marginTop: '24px', marginBottom: '32px' }}>
          {error?.message || 'Ocurrió un error al cargar tu perfil'}
        </Body>
        <ButtonRs onPress={reset}>
          Intentar de nuevo
        </ButtonRs>
      </main>
    </div>
  )
}

