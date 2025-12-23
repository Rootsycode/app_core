'use client'

import { Body, Link, Title } from 'rootsy-feparts'
import { useRouter } from 'next/navigation'

import { withGuestAuth } from '@/hoc/withGuestAuth'
import { LoginLayout } from '@/components/layouts/LoginLayout'
import LoginWithCredentialsForm from '../login/components/LoginWithCredentialsForm'
import LoginWithGoogleForm from '../login/components/LoginWithGoogleForm'
import styles from './page.module.css'

const Page = () => {
  const router = useRouter()

  return (
    <LoginLayout>
      <Title size='xs'>Iniciar sesión</Title>
      <Body size='sm'>
        ¿No tenés cuenta?{' '}
        <Link onPress={() => router.push('signup')}>Registrarte</Link> es muy
        fácil.
      </Body>

      <LoginWithCredentialsForm router={router} />

      <Body size='sm' style={{ textAlign: 'center', marginTop: '12px' }}>
        <Link>No recuerdo mi contraseña</Link>
      </Body>

      <div className={styles.divider} aria-hidden />

      <LoginWithGoogleForm router={router} />
    </LoginLayout>
  )
}

export default withGuestAuth(Page)
