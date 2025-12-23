'use client'

import { useEffect, useState } from 'react'
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
import { useAuth } from '@/context/AuthContextSupabase'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { DownloadCloudIcon12 } from '@/components/atoms/icons/DowloadCloudIcon12'
import { RootsyLogo } from '@/components/atoms/RootsyLogo'
import { getUserPops, getUserProfile } from './actions'
import styles from './page.module.css'

const Header = () => {
  const { logOut } = useAuth()
  
  const handleLogOut = async () => {
    await logOut()
    window.location.href = '/auth/login'
  }

  return (
    <header className={styles.header}>
      <RootsyLogo className={styles.logo} />

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
          <MenuItem onAction={handleLogOut}>
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
  const [pops, setPops] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const { loading } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingProfile(true)
        const [popsData, profileData] = await Promise.all([
          getUserPops(),
          getUserProfile()
        ])
        setPops(popsData)
        setUserProfile(profileData)
      } catch (err) {
        console.error('Error al cargar los datos:', err)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    if (!loading) {
      fetchData()
    }
  }, [loading])

  // Obtener el nombre del usuario desde el perfil (ya está cargado)
  const userName = userProfile?.fullName || 'Usuario'

  // Componente Skeleton - misma estructura que el contenido real
  const SkeletonLoader = () => (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        {/* Skeleton del título - usando div con clase skeleton pero mismo tamaño que Title */}
        <div 
          className={styles.skeleton} 
          style={{ 
            width: '320px',
            height: '40px',
            margin: '0 auto',
            borderRadius: '4px'
          }}
        />
        <Separe height={80} />
        {/* Skeleton del body - usando div con clase skeleton pero mismo tamaño que Body lg */}
        <div 
          className={styles.skeleton} 
          style={{ 
            width: '450px',
            height: '28px',
            margin: '0 auto',
            borderRadius: '4px'
          }}
        />
        <Separe height={40} />
        <div className={styles.pops}>
          <ul>
            <li>
              <ButtonPop skeleton />
            </li>
            <li>
              <ButtonPop skeleton />
            </li>
            <li>
              <ButtonPop skeleton />
            </li>
            <li>
              <ButtonPop aria-label="Abrir nuevo punto de venta" />
            </li>
          </ul>
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footer_container}>
          {/* Skeleton del body del footer */}
          <div 
            className={styles.skeleton} 
            style={{ 
              width: '350px',
              height: '20px',
              borderRadius: '4px'
            }}
          />
          <Separe width={20} />
          {/* Skeleton del botón */}
          <div 
            className={styles.skeleton} 
            style={{ 
              width: '130px',
              height: '36px',
              borderRadius: '6px'
            }} 
          />
        </div>
      </footer>
    </div>
  )

  if(loading || isLoadingProfile) return <SkeletonLoader />

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <Title>¡Bienvenido {userName}! 👋</Title>
        <Separe height={80} />
        <Body size='lg'>¿A qué punto de venta querés ingresar?</Body>
        <Separe height={40} />
        <div className={styles.pops}>
          <ul>
            {pops ? (
              pops.map((pop) => (
                <li key={pop.id}>
                  <ButtonPop name={pop.name} />
                </li>
              ))
            ) : (
              <li>
                <ButtonPop skeleton />
              </li>
            )}
            <li>
              <ButtonPop aria-label="Abrir nuevo punto de venta" />
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

export default Page
