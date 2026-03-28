'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
        <MenuButton iconButton inverted>
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
  const router = useRouter()
  const [pops, setPops] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const { loading } = useAuth()

  const handleCreatePop = () => {
    router.push('/pops/create')
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingProfile(true)
        const [popsData, profileData] = await Promise.all([
          getUserPops().catch((err) => {
            console.error('Error fetching pops:', err)
            return []
          }),
          getUserProfile().catch((err) => {
            console.error('Error fetching profile:', err)
            return null
          })
        ])
        setPops(popsData || [])
        setUserProfile(profileData)
      } catch (err) {
        console.error('Error al cargar los datos:', err)
        setPops([])
        setUserProfile(null)
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
        <Title color="white">¡Bienvenido {userName}! 👋</Title>
        <Separe height={80} />
        <Body size="lg" color="white">
          ¿A qué punto de venta querés ingresar?
        </Body>
        <Separe height={40} />
        <div className={styles.pops}>
          <ul>
            {pops ? (
              pops.map((pop) => (
                <li key={pop.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ButtonPop 
                      name={pop.name}
                      onClick={() => router.push(`/${pop.id}/menu`)}
                    />
                          {pop.subscription && (
                            <div
                              style={{
                                marginTop: '8px',
                                textAlign: 'center',
                                maxWidth: '200px'
                              }}
                            >
                              {pop.subscription.status === 'trial' && (
                                <div>
                                  <Body size="xs" color="white" style={{ fontWeight: '500' }}>
                                    Prueba gratis
                                  </Body>
                                  <br />
                                  <Body size="xs" color="white">
                                    {pop.subscription.daysRemaining || pop.subscription.days_remaining || 0} días restantes
                                  </Body>
                                </div>
                              )}
                              {pop.subscription.status === 'active' && (
                                <div>
                                  <Body size="md" color="white">
                                    <strong>{pop.subscription.planDisplayName || pop.subscription.planName}</strong>
                                  </Body>
                                  <br />
                                  <Body size="md" color="white">
                                    {pop.subscription.businessTypeDisplayName || pop.subscription.businessTypeName}
                                  </Body>
                                </div>
                              )}
                              {pop.isOwner && pop.subscription.isActive === false && (
                                <div style={{ marginTop: '10px' }}>
                                  <ButtonRs
                                    size='sm'
                                    hierarchy='secondary'
                                    inverted
                                    onPress={() =>
                                      router.push(`/pops/${pop.id}/subscribe`)
                                    }
                                  >
                                    Activar suscripción
                                  </ButtonRs>
                                </div>
                              )}
                            </div>
                          )}
                  </div>
                </li>
              ))
            ) : (
              <li>
                <ButtonPop skeleton />
              </li>
            )}
            <li>
              <ButtonPop 
                aria-label="Abrir nuevo punto de venta" 
                onClick={handleCreatePop}
              />
            </li>
          </ul>
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footer_container}>
          <Body size="sm" color="white">
            ¡Instalá el sistema en tu compu y accedé más fácil y rápido!
          </Body>
          <Separe width={20} />
          <ButtonRs
            leftIcon={<DownloadCloudIcon12 />}
            size='sm'
            hierarchy='secondary'
            inverted
          >
            Descargar
          </ButtonRs>
        </div>
      </footer>
    </div>
  )
}

export default Page
