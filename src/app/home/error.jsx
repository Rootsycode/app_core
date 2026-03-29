'use client'

import { Body, ButtonRs, Title } from 'rootsy-feparts'
import styles from './page.module.css'

export default function Error ({ error, reset }) {
  return (
    <div className={styles.container}>
      <main className={styles.main} style={{ textAlign: 'center' }}>
        <Title>Algo salió mal</Title>
        <Body size='lg' style={{ marginTop: '24px', marginBottom: '32px' }}>
          {error?.message || 'Ocurrió un error al cargar esta pantalla'}
        </Body>
        <ButtonRs onPress={reset}>
          Intentar de nuevo
        </ButtonRs>
      </main>
    </div>
  )
}
