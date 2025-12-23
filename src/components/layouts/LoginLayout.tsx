import { Body } from 'rootsy-feparts'
import { RootsyLogo } from '@/components/atoms/RootsyLogo'
import styles from './LoginLayout.module.css'
import React from 'react'

export const LoginLayout = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.container}>
    <section className={styles.section}>
      <div className={styles.logoContainer}>
        <RootsyLogo width={150} height={40} textColor="#FFFFFF" />
      </div>
      <Body className={styles.subtitle} size='xs'>
        Sistema de gestión online
      </Body>

      <div className={styles.card}>{children}</div>
    </section>
  </div>
)
