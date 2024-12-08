'use client'

import { Body, Link, Title } from 'rootsy-feparts'
import withAuth from '@/hoc/withAuth'
import styles from './page.module.css'
import { useAuth } from '@/context/AuthContext'

const Page = () => {
  const { logOut, user } = useAuth()

  return (
    <div className={styles.container}>
      <Title>Bienvenido</Title>
      <Link onPress={logOut}>Logout</Link>
      <Body style={{ width: '100%' }}>{JSON.stringify(user)}</Body>
    </div>
  )
}

export default withAuth(Page)
