'use client'

import { useEffect } from 'react'
import { Body, ButtonRs, Title } from 'rootsy-feparts'
import styles from './page.module.css'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Test POP page error:', error)
  }, [error])

  return (
    <div className={styles.container}>
      <Title>Algo salió mal</Title>
      <Body size='sm' style={{ marginTop: '16px', marginBottom: '24px' }}>
        {error?.message || 'Ocurrió un error en la página de prueba'}
      </Body>
      <ButtonRs onPress={reset}>
        Intentar de nuevo
      </ButtonRs>
    </div>
  )
}

