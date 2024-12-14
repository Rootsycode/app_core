'use client'

import {
  Body,
  ButtonPop,
  ButtonRs,
  ButtonThumb,
  MenuButton,
  MenuItem,
  Separe,
  Title
} from 'rootsy-feparts'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContext'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { DownloadCloudIcon12 } from '@/components/atoms/icons/DowloadCloudIcon12'
import styles from './page.module.css'
import { useEffect, useState } from 'react'
import { getPop } from '../services/pop'

const Header = () => {
  const { logOut } = useAuth()
  return (
    <header className={styles.header}>
      <Title size='sm'>ROOTSY</Title>

      <div className={styles.buttons_right}>
        <MenuButton iconButton>
          <MenuItem>
            <ProfileIcon16 />
            Ver perfil
          </MenuItem>
          <MenuItem>
            <HelpIcon16 />
            Ayuda
          </MenuItem>
          <MenuItem onAction={logOut}>
            <CloseSessionIcon16 />
            Cerrar sesión
          </MenuItem>
        </MenuButton>
        <ButtonThumb src='https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq' />
      </div>
    </header>
  )
}

const Page = () => {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUserPops('XE5g908kPK5fb9JII2sp')
        setData(response)

        console.log('la respuesta es: ', response)
      } catch (err) {
        setError('Error al cargar los datos')
      }
    }

    fetchData()
  }, [])

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <Title>¡Bienvenido {user.displayName}! 👋</Title>
        <Separe height={80} />
        <Body size='lg'>¿A qué punto de venta querés ingresar?</Body>
        <Separe height={40} />
        <div className={styles.pops}>
          <ul>
            <li>
              <ButtonPop name='Rootsy Market' />
            </li>
            <li>
              <ButtonPop />
            </li>
          </ul>
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footer_container}>
          <Body size='sm'>
            ¡Instalá el sistema en tu compu y accedé más fácil y rápido!
          </Body>
          <Separe width={20} />
          <ButtonRs
            leftIcon={<DownloadCloudIcon12 />}
            size='sm'
            hierarchy='secondary'
          >
            Descargar
          </ButtonRs>
        </div>
      </footer>
    </div>
  )
}

export default withAuth(Page)
