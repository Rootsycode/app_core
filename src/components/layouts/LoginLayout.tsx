import { Body, Title } from 'rootsy-feparts'
import styles from './LoginLayout.module.css'
import React from 'react'

export const LoginLayout = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.container}>
    <section className={styles.section}>
      <Title className={styles.title} size='md'>
        ROOTSY
      </Title>
      <Body className={styles.subtitle} size='xs'>
        Sistema de gestión online
      </Body>

      <div className={styles.card}>{children}</div>
    </section>
  </div>
)
