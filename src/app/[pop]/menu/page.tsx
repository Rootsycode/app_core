'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import {
  Body,
  Button,
  ButtonIcon,
  ButtonThumb,
  MenuButton,
  MenuItem,
  SearchField,
  Separe,
  Title,
  Utility
} from 'rootsy-feparts'
import { HomeIcon24 } from '@/components/atoms/icons/HomeIcon24'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { AlertIcon24 } from '@/components/atoms/icons/AlertIcon24'
import { MENU } from '@/constant/Menu'
import { getPopMenuData } from './actions'
import styles from './page.module.css'

interface ButtonSection {
  icon?: React.ReactNode
  label?: string
  action?: (() => void) | null
  disabled: boolean
}

const ButtonSection = ({ icon, label, action, disabled }: ButtonSection) => (
  <div className={styles.button_section_container}>
    <Button
      onPress={action && action}
      className={`${styles.button_section_button} ${
        disabled && styles.button_section_disabled
      }`}
    >
      {icon}
    </Button>
    <Utility size='md'>{label}</Utility>
  </div>
)

const Page = () => {
  const router = useRouter()
  const params = useParams()
  const { user, logOut } = useAuth()
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true })
  const popId = params?.pop as string | undefined
  const [popData, setPopData] = useState<{
    id: string
    name: string
    imageUrl: string | null
    address: string | null
  } | null>(null)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos del POP y permisos
  useEffect(() => {
    console.log('Menu page - params:', params)
    console.log('Menu page - popId:', popId)
    
    if (!popId) {
      console.log('Menu page - No popId found, setting error')
      setLoading(false)
      setError('ID de POP no encontrado')
      return
    }

    const loadPopData = async () => {
      try {
        console.log('Menu page - Loading POP data for:', popId)
        setLoading(true)
        setError(null)
        const result = await getPopMenuData(popId)
        console.log('Menu page - Result:', result)

        if (!result.success) {
          console.error('Menu page - Error loading data:', result.error)
          setError(result.error || 'Error al cargar datos')
          if (result.redirect) {
            setTimeout(() => {
              router.push(result.redirect!)
            }, 2000)
          }
          setLoading(false)
          return
        }

        console.log('Menu page - Setting pop data and permissions')
        // Usar un batch update para evitar múltiples re-renders
        setPopData(result.pop!)
        setPermissions(result.permissions || {})
        // Usar setTimeout para que el setLoading se ejecute después del render
        setTimeout(() => {
          setLoading(false)
        }, 0)
      } catch (err: any) {
        console.error('Menu page - Error loading POP data:', err)
        setError('Error inesperado al cargar datos: ' + (err.message || 'Error desconocido'))
        setLoading(false)
      }
    }

    loadPopData()
  }, [popId, router])

  // Re-inicializar Embla solo cuando los datos estén listos
  useEffect(() => {
    if (emblaApi && !loading && popData) {
      console.log('Menu page - Reinitializing Embla')
      emblaApi.reInit()
    }
  }, [emblaApi, loading, popData])

  const handleHomeClick = () => {
    router.push('/profile')
  }

  const handleMenuItemClick = (link?: string) => {
    if (!link || !popId) return
    // Navegar a la sección correspondiente
    router.push(`/${popId}/${link}`)
  }

  // Memoizar los items del menú procesados para evitar recalcular en cada render
  const processedMenuItems = useMemo(() => {
    if (!popData || Object.keys(permissions).length === 0) return []
    
    console.log('Menu page - Processing menu items')
    return MENU.map((groups, groupIndex) => ({
      groupIndex,
      items: groups.map((item, itemIndex) => {
        const hasPermission = permissions[item.label] ?? false
        const isDisabled = !hasPermission || !item.link
        return {
          ...item,
          itemIndex,
          hasPermission,
          isDisabled
        }
      })
    }))
  }, [popData, permissions])

  if (loading) {
    return (
      <div className={styles.grid}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Body size='md'>Cargando...</Body>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.grid}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Body size='md' style={{ color: 'var(--invalid-color, #ef4444)' }}>
            {error}
          </Body>
          {error.includes('redirigiendo') && (
            <Body size='sm' style={{ marginTop: '16px', color: '#666' }}>
              Redirigiendo...
            </Body>
          )}
        </div>
      </div>
    )
  }

  if (!popData) {
    return (
      <div className={styles.grid}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Body size='md'>No se encontraron datos del POP</Body>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.grid}>
        <header className={styles.header}>
          <div className={styles.left}>
            <ButtonIcon 
              className={styles.home_button} 
              icon={<HomeIcon24 />} 
              onPress={handleHomeClick}
            />
            <Separe width={24} />
            <ButtonThumb 
              src={popData.imageUrl || 'https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq'} 
            />

            <Separe width={12} />
            <div className={styles.pop_text}>
              <Title size='xs'>{popData.name}</Title>
              <Body size='md'>{popData.address || 'Sin dirección'}</Body>
            </div>
          </div>

          <div className={styles.center}>
            <SearchField placeholder='Buscar sección' />
          </div>

          <div className={styles.right}>
            <ButtonIcon icon={<AlertIcon24 />} />
            <Separe width={8} />

            <MenuButton iconButton>
              <MenuItem onAction={() => router.push('/profile')}>
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
            <Separe width={12} />

            <ButtonThumb src={user?.user_metadata?.avatar_url || 'https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq'} />
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.section_main}>
            <div className={styles.embla} ref={emblaRef}>
              <div className={styles.embla__container}>
                {processedMenuItems.map((group) => (
                  <div className={styles.embla__slide} key={group.groupIndex}>
                    <div className={styles.items__grid}>
                      {group.items.map((item) => (
                        <div
                          className={styles.embla_inner_slide}
                          key={`carousel-${group.groupIndex}-${item.itemIndex}`}
                        >
                          <ButtonSection
                            disabled={item.isDisabled}
                            label={item.label}
                            icon={<img src={item.img} aria-hidden alt={item.label} loading="lazy" />}
                            action={
                              !item.isDisabled && item.link
                                ? () => handleMenuItemClick(item.link)
                                : null
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

export default withAuth(Page)
