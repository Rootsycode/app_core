'use client'

import { useEffect, useState, useMemo, type CSSProperties } from 'react'
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

function menuGridBackgroundStyle (
  backgroundImageUrl: string | null | undefined
): CSSProperties | undefined {
  const u = backgroundImageUrl?.trim()
  if (!u) return undefined
  return { backgroundImage: `url(${JSON.stringify(u)})` }
}

interface ButtonSection {
  icon?: React.ReactNode
  label?: string
  action?: (() => void) | null
  disabled: boolean
}

const ButtonSection = ({ icon, label, action, disabled }: ButtonSection) => (
  <div className={styles.button_section_container}>
    <Button
      onPress={action || undefined}
      className={`${styles.button_section_button} ${disabled && styles.button_section_disabled
        }`}
    >
      {icon}
    </Button>
    <Utility size='md' color='white'>
      {label}
    </Utility>
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
    backgroundImageUrl?: string | null
  } | null>(null)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!popId) {
      setLoading(false)
      setError('ID de POP no encontrado')
      return
    }

    const loadPopData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getPopMenuData(popId)

        if (!result.success) {
          setError(result.error || 'Error al cargar datos')
          if (result.redirect) {
            setTimeout(() => {
              router.push(result.redirect!)
            }, 2000)
          }
          setLoading(false)
          return
        }

        setPopData(result.pop!)
        setPermissions(result.permissions || {})
        setTimeout(() => {
          setLoading(false)
        }, 0)
      } catch (err: any) {
        setError(
          'Error inesperado al cargar datos: ' +
          (err.message || 'Error desconocido')
        )
        setLoading(false)
      }
    }

    loadPopData()
  }, [popId, router])

  useEffect(() => {
    if (emblaApi && !loading && popData) {
      emblaApi.reInit()
    }
  }, [emblaApi, loading, popData])

  const handleHomeClick = () => {
    router.push('/home')
  }

  const handleMenuItemClick = (link?: string) => {
    if (!link || !popId) return
    router.push(`/${popId}/${link}`)
  }

  const processedMenuItems = useMemo(() => {
    if (!popData || Object.keys(permissions).length === 0) return []

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
      <div
        className={styles.grid}
        style={menuGridBackgroundStyle(popData.backgroundImageUrl)}
      >
        <header className={styles.header}>
          <div className={styles.left}>
            <ButtonIcon
              className={styles.home_button}
              icon={<HomeIcon24 />}
              onPress={handleHomeClick}
            />
            <Separe width={24} />
            <ButtonThumb
              src={
                popData.imageUrl ||
                'https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq'
              }
            />

            <Separe width={12} />
            <div className={styles.pop_text}>
              <Title size='xs' color='white'>
                {popData.name}
              </Title>
              <Body size='md' color='white'>
                {popData.address || 'Sin dirección'}
              </Body>
            </div>
          </div>

          <div className={styles.center}>
            <SearchField
              placeholder='Buscar sección'
              icon={
                <svg
                  fill='#000000'
                  width='800px'
                  height='800px'
                  viewBox='0 -0.24 28.423 28.423'
                  id='_02_-_Search_Button'
                  data-name='02 - Search Button'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    id='Path_215'
                    data-name='Path 215'
                    d='M14.953,2.547A12.643,12.643,0,1,0,27.6,15.19,12.649,12.649,0,0,0,14.953,2.547Zm0,2A10.643,10.643,0,1,1,4.31,15.19,10.648,10.648,0,0,1,14.953,4.547Z'
                    transform='translate(-2.31 -2.547)'
                    fill-rule='evenodd'
                  />
                  <path
                    id='Path_216'
                    data-name='Path 216'
                    d='M30.441,28.789l-6.276-6.276a1,1,0,1,0-1.414,1.414L29.027,30.2a1,1,0,1,0,1.414-1.414Z'
                    transform='translate(-2.31 -2.547)'
                    fill-rule='evenodd'
                  />
                </svg>
              }
            />
          </div>

          <div className={styles.right}>
            <ButtonIcon icon={<AlertIcon24 />} inverted />
            <Separe width={8} />

            <MenuButton iconButton inverted>
              <MenuItem onAction={() => router.push('/profile')}>
                <ProfileIcon16 />
                Mi cuenta
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

            <ButtonThumb
              src={
                user?.user_metadata?.avatar_url ||
                'https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq'
              }
            />
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.section_main}>
            <div className={styles.embla} ref={emblaRef}>
              <div className={styles.embla__container}>
                {processedMenuItems.map(group => (
                  <div className={styles.embla__slide} key={group.groupIndex}>
                    <div className={styles.items__grid}>
                      {group.items.map(item => (
                        <div
                          className={styles.embla_inner_slide}
                          key={`carousel-${group.groupIndex}-${item.itemIndex}`}
                        >
                          <ButtonSection
                            disabled={item.isDisabled}
                            label={item.label}
                            icon={
                              <img
                                src={item.img}
                                aria-hidden
                                alt={item.label}
                                loading='lazy'
                              />
                            }
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
