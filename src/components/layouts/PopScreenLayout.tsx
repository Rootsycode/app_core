'use client'

import type { ReactNode } from 'react'
import styles from './PopScreenLayout.module.css'

export type PopScreenLayoutProps = {
  /** Contenido de la fila superior fija (64px), p. ej. barra de herramientas. */
  header: ReactNode
  /** Contenido principal con scroll y fondo grayscale-100. */
  body: ReactNode
}

export function PopScreenLayout ({ header, body }: PopScreenLayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>{header}</div>
      <div className={styles.body}>{body}</div>
    </div>
  )
}
